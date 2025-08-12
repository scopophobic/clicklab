// Mouse Health Test Application
class MouseHealthTest {
    constructor() {
        this.currentStep = 0;
        this.testScores = {
            button: 0,
            scroll: 0,
            tracking: 0,
            doubleclick: 0,
            drag: 0,
            polling: 0
        };
        this.testData = {
            button: { left: false, right: false, middle: false },
            scroll: { up: 0, down: 0 },
            tracking: { points: [], smoothness: 0, jitter: 0 },
            doubleclick: { times: [], best: null, average: null },
            drag: { holdTime: 0, completed: false },
            polling: { events: 0, rate: 0 }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateProgress();
    }

    bindEvents() {
        // Start test button
        document.getElementById('start-test').addEventListener('click', () => {
            this.showScreen('test-container');
            this.startButtonTest();
        });

        // Next step button
        document.getElementById('next-step').addEventListener('click', () => {
            this.nextStep();
        });

        // Retake test button
        document.getElementById('retake-test').addEventListener('click', () => {
            this.resetTest();
        });

        // Share results button
        document.getElementById('share-results').addEventListener('click', () => {
            this.shareResults();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / 6) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `Step ${this.currentStep + 1} of 6`;
    }

    startButtonTest() {
        this.currentStep = 0;
        this.updateProgress();
        this.updateTestInfo('Button Test', 'Click all three mouse buttons to test functionality');
        
        // Bind button test events
        document.querySelectorAll('.test-button').forEach(button => {
            // Prevent context menu on right-click
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
            
            // Left click
            button.addEventListener('click', (e) => {
                const buttonType = e.currentTarget.dataset.button;
                if (buttonType === 'left') {
                    this.testData.button.left = true;
                    e.currentTarget.classList.add('completed');
                    e.currentTarget.querySelector('.button-indicator').textContent = '✓ Left Clicked!';
                }
                this.checkButtonCompletion();
            });
            
            // Right click
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const buttonType = e.currentTarget.dataset.button;
                if (buttonType === 'right') {
                    this.testData.button.right = true;
                    e.currentTarget.classList.add('completed');
                    e.currentTarget.querySelector('.button-indicator').textContent = '✓ Right Clicked!';
                }
                this.checkButtonCompletion();
            });
            
            // Middle click
            button.addEventListener('mousedown', (e) => {
                const buttonType = e.currentTarget.dataset.button;
                if (buttonType === 'middle' && e.button === 1) {
                    e.preventDefault();
                    this.testData.button.middle = true;
                    e.currentTarget.classList.add('completed');
                    e.currentTarget.querySelector('.button-indicator').textContent = '✓ Middle Clicked!';
                    this.checkButtonCompletion();
                }
            });
        });
        
        // Add skip button for button test
        this.addSkipButton('Button Test', () => {
            // Calculate partial score based on what was actually clicked
            let partialScore = 0;
            if (this.testData.button.left) partialScore += 5;
            if (this.testData.button.right) partialScore += 5;
            if (this.testData.button.middle) partialScore += 5;
            
            // If no buttons were clicked, give minimum score
            if (partialScore === 0) partialScore = 5;
            
            this.testScores.button = partialScore;
            this.enableNextStep();
        });
    }

    checkButtonCompletion() {
        if (this.testData.button.left && this.testData.button.right && this.testData.button.middle) {
            this.testScores.button = 15;
            this.enableNextStep();
        }
    }

    startScrollTest() {
        this.currentStep = 1;
        this.updateProgress();
        this.updateTestInfo('Scroll Test', 'Scroll up and down in the area to test your scroll wheel');
        
        const scrollArea = document.querySelector('.scroll-area');
        let upScrolls = 0;
        let downScrolls = 0;
        
        scrollArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (e.deltaY < 0) {
                upScrolls++;
                document.getElementById('up-scrolls').textContent = upScrolls;
                if (upScrolls >= 3) {
                    document.querySelector('.scroll-indicator.up').classList.add('completed');
                }
            } else {
                downScrolls++;
                document.getElementById('down-scrolls').textContent = downScrolls;
                if (downScrolls >= 3) {
                    document.querySelector('.scroll-indicator.down').classList.add('completed');
                }
            }
            
            this.testData.scroll.up = upScrolls;
            this.testData.scroll.down = downScrolls;
            
            // Enable next step when both directions are tested
            if (upScrolls >= 3 && downScrolls >= 3) {
                this.testScores.scroll = 15;
                this.enableNextStep();
            }
        });
        
        // Add skip button for scroll test
        this.addSkipButton('Scroll Test', () => {
            this.testScores.scroll = 5; // Give minimum score for skipping
            this.enableNextStep();
        });
    }

    startTrackingTest() {
        this.currentStep = 2;
        this.updateProgress();
        this.updateTestInfo('Pointer Tracking', 'Move your mouse smoothly across the canvas');
        
        const canvas = document.getElementById('tracking-canvas');
        const ctx = canvas.getContext('2d');
        const points = [];
        let isDrawing = false;
        let testCompleted = false;
        
        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        canvas.addEventListener('mousedown', () => {
            isDrawing = true;
            points.length = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            points.push({ x, y, timestamp: Date.now() });
            
            if (points.length === 1) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            
            // Check if we have enough points to complete the test
            if (points.length > 10 && !testCompleted) {
                testCompleted = true;
                this.calculateTrackingMetrics(points);
                this.testScores.tracking = 20;
                this.enableNextStep();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            if (points.length > 2 && !testCompleted) {
                this.calculateTrackingMetrics(points);
                // If we have enough points, complete the test
                if (points.length > 10) {
                    testCompleted = true;
                    this.testScores.tracking = 20;
                    this.enableNextStep();
                }
            }
        });
        
        // Auto-complete after 8 seconds if not already completed
        setTimeout(() => {
            if (!testCompleted) {
                if (points.length > 2) {
                    this.calculateTrackingMetrics(points);
                }
                // Give a minimum score based on points collected
                if (points.length > 5) {
                    this.testScores.tracking = 15;
                } else if (points.length > 2) {
                    this.testScores.tracking = 10;
                } else {
                    this.testScores.tracking = 5;
                }
                testCompleted = true;
                this.enableNextStep();
            }
        }, 8000);
        
        // Add skip button for tracking test
        this.addSkipButton('Pointer Tracking', () => {
            this.testScores.tracking = 5; // Give minimum score for skipping
            this.enableNextStep();
        });
    }

    calculateTrackingMetrics(points) {
        if (points.length < 2) return;
        
        this.testData.tracking.points = points;
        
        // Calculate smoothness (average distance between points)
        let totalDistance = 0;
        let totalTime = 0;
        
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            totalDistance += Math.sqrt(dx*dx + dy*dy);
            totalTime += points[i].timestamp - points[i-1].timestamp;
        }
        
        const avgDistance = totalDistance / (points.length - 1);
        const avgTime = totalTime / (points.length - 1);
        
        // Smoothness score (lower is better)
        const smoothness = Math.max(0, 100 - (avgDistance * 0.1));
        const jitter = Math.max(0, 100 - (avgTime * 0.01));
        
        this.testData.tracking.smoothness = Math.round(smoothness);
        this.testData.tracking.jitter = Math.round(jitter);
        
        document.getElementById('smoothness-score').textContent = `${this.testData.tracking.smoothness}%`;
        document.getElementById('jitter-score').textContent = `${this.testData.tracking.jitter}%`;
        
        // Calculate tracking score
        this.testScores.tracking = Math.round((smoothness + jitter) / 10);
    }

    startDoubleClickTest() {
        this.currentStep = 3;
        this.updateProgress();
        this.updateTestInfo('Double-Click Speed', 'Double-click as fast as you can!');
        
        const clickTarget = document.getElementById('click-target');
        let lastClickTime = 0;
        let clickCount = 0;
        
        clickTarget.addEventListener('click', () => {
            const currentTime = Date.now();
            
            if (currentTime - lastClickTime < 500) {
                // Double click detected
                const doubleClickTime = currentTime - lastClickTime;
                this.testData.doubleclick.times.push(doubleClickTime);
                
                clickTarget.classList.add('clicked');
                setTimeout(() => clickTarget.classList.remove('clicked'), 200);
                
                // Update stats
                const best = Math.min(...this.testData.doubleclick.times);
                const average = this.testData.doubleclick.times.reduce((a, b) => a + b, 0) / this.testData.doubleclick.times.length;
                
                this.testData.doubleclick.best = best;
                this.testData.doubleclick.average = Math.round(average);
                
                document.getElementById('best-time').textContent = `${best}ms`;
                document.getElementById('avg-time').textContent = `${this.testData.doubleclick.average}ms`;
                
                // Calculate score
                if (best < 100) this.testScores.doubleclick = 15;
                else if (best < 200) this.testScores.doubleclick = 10;
                else if (best < 300) this.testScores.doubleclick = 5;
                else this.testScores.doubleclick = 0;
                
                if (this.testData.doubleclick.times.length >= 3) {
                    this.enableNextStep();
                }
            }
            
            lastClickTime = currentTime;
        });
        
        // Add skip button for double click test
        this.addSkipButton('Double-Click Speed', () => {
            this.testScores.doubleclick = 5; // Give minimum score for skipping
            this.enableNextStep();
        });
    }

    startDragTest() {
        this.currentStep = 4;
        this.updateProgress();
        this.updateTestInfo('Drag & Drop', 'Drag the source to the target area');
        
        const dragSource = document.getElementById('drag-source');
        const dragTarget = document.getElementById('drag-target');
        let isDragging = false;
        let startTime = 0;
        let offsetX, offsetY;
        
        // Store event listeners so we can remove them later
        const mouseMoveHandler = (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            dragSource.style.position = 'fixed';
            dragSource.style.left = x + 'px';
            dragSource.style.top = y + 'px';
            dragSource.style.zIndex = '1000';
        };
        
        const mouseUpHandler = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            dragSource.classList.remove('dragging');
            
            const targetRect = dragTarget.getBoundingClientRect();
            
            // Check if source is over target
            if (e.clientX >= targetRect.left && e.clientX <= targetRect.right &&
                e.clientY >= targetRect.top && e.clientY <= targetRect.bottom) {
                
                // Successfully dropped on target
                dragTarget.classList.add('dropped');
                dragSource.style.display = 'none';
                
                const holdTime = Date.now() - startTime;
                this.testData.drag.holdTime = holdTime;
                this.testData.drag.completed = true;
                
                document.getElementById('hold-time').textContent = `${holdTime}ms`;
                
                // Calculate score
                if (holdTime < 1000) this.testScores.drag = 15;
                else if (holdTime < 2000) this.testScores.drag = 10;
                else if (holdTime < 3000) this.testScores.drag = 5;
                else this.testScores.drag = 0;
                
                // Remove event listeners
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                
                this.enableNextStep();
            } else {
                // Reset position if not dropped on target
                dragSource.style.position = 'static';
                dragSource.style.left = '';
                dragSource.style.top = '';
                dragSource.style.zIndex = '';
            }
        };
        
        dragSource.addEventListener('mousedown', (e) => {
            isDragging = true;
            startTime = Date.now();
            dragSource.classList.add('dragging');
            
            const rect = dragSource.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        // Add skip button for drag test
        this.addSkipButton('Drag & Drop', () => {
            // Remove event listeners when skipping
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            
            // Reset drag source position
            dragSource.style.position = 'static';
            dragSource.style.left = '';
            dragSource.style.top = '';
            dragSource.style.zIndex = '';
            dragSource.classList.remove('dragging');
            
            this.testScores.drag = 5; // Give minimum score for skipping
            this.enableNextStep();
        });
    }

    startPollingTest() {
        this.currentStep = 5;
        this.updateProgress();
        this.updateTestInfo('Polling Rate', 'Move your mouse in small circles for 10 seconds to test responsiveness');
        
        let eventCount = 0;
        let countdown = 10;
        const countdownElement = document.getElementById('polling-countdown');
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.completePollingTest(eventCount);
            }
        }, 1000);
        
        // Count mouse events
        document.addEventListener('mousemove', () => {
            eventCount++;
        });
        
        document.addEventListener('click', () => {
            eventCount++;
        });
        
        // Add skip button for polling test
        this.addSkipButton('Polling Rate', () => {
            this.testScores.polling = 5; // Give minimum score for skipping
            this.enableNextStep();
        });
    }

    completePollingTest(eventCount) {
        this.testData.polling.events = eventCount;
        this.testData.polling.rate = Math.round(eventCount / 10);
        
        document.getElementById('polling-rate').textContent = `${this.testData.polling.rate} events/sec`;
        
        // Calculate polling score
        if (this.testData.polling.rate >= 100) this.testScores.polling = 20;
        else if (this.testData.polling.rate >= 60) this.testScores.polling = 15;
        else if (this.testData.polling.rate >= 30) this.testScores.polling = 10;
        else this.testScores.polling = 5;
        
        // Complete the test
        setTimeout(() => {
            this.showResults();
        }, 1000);
    }

    updateTestInfo(title, description) {
        document.getElementById('current-test-title').textContent = title;
        document.getElementById('current-test-description').textContent = description;
        
        // Hide all test steps
        document.querySelectorAll('.test-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current test step
        const testSteps = ['button-test', 'scroll-test', 'pointer-test', 'doubleclick-test', 'drag-test', 'polling-test'];
        document.getElementById(testSteps[this.currentStep]).classList.add('active');
    }

    enableNextStep() {
        document.getElementById('next-step').disabled = false;
    }

    nextStep() {
        document.getElementById('next-step').disabled = true;
        
        switch (this.currentStep) {
            case 0:
                this.startScrollTest();
                break;
            case 1:
                this.startTrackingTest();
                break;
            case 2:
                this.startDoubleClickTest();
                break;
            case 3:
                this.startDragTest();
                break;
            case 4:
                this.startPollingTest();
                break;
        }
    }

    showResults() {
        const totalScore = Object.values(this.testScores).reduce((a, b) => a + b, 0);
        
        // Update final score
        document.getElementById('final-score').textContent = totalScore;
        
        // Update breakdown scores
        document.getElementById('button-score').textContent = `${this.testScores.button}/15`;
        document.getElementById('scroll-score').textContent = `${this.testScores.scroll}/15`;
        document.getElementById('tracking-score').textContent = `${this.testScores.tracking}/20`;
        document.getElementById('doubleclick-score').textContent = `${this.testScores.doubleclick}/15`;
        document.getElementById('drag-score').textContent = `${this.testScores.drag}/15`;
        document.getElementById('polling-score').textContent = `${this.testScores.polling}/20`;
        
        // Update health assessment
        let assessmentText = '';
        let assessmentClass = '';
        
        if (totalScore >= 80) {
            assessmentText = 'Your mouse is in excellent condition!';
            assessmentClass = 'excellent';
        } else if (totalScore >= 50) {
            assessmentText = 'Your mouse has some wear or issues present.';
            assessmentClass = 'fair';
        } else {
            assessmentText = 'Your mouse may need replacement or repair.';
            assessmentClass = 'poor';
        }
        
        document.getElementById('assessment-text').textContent = assessmentText;
        document.getElementById('health-assessment').className = `health-assessment ${assessmentClass}`;
        
        this.showScreen('results-screen');
    }

    resetTest() {
        // Reset all test data
        this.currentStep = 0;
        this.testScores = {
            button: 0,
            scroll: 0,
            tracking: 0,
            doubleclick: 0,
            drag: 0,
            polling: 0
        };
        this.testData = {
            button: { left: false, right: false, middle: false },
            scroll: { up: 0, down: 0 },
            tracking: { points: [], smoothness: 0, jitter: 0 },
            doubleclick: { times: [], best: null, average: null },
            drag: { holdTime: 0, completed: false },
            polling: { events: 0, rate: 0 }
        };
        
        // Remove all skip buttons
        const existingSkipButtons = document.querySelectorAll('.skip-button');
        existingSkipButtons.forEach(button => button.remove());
        
        // Reset UI
        document.querySelectorAll('.test-button').forEach(button => {
            button.classList.remove('completed');
            button.querySelector('.button-indicator').textContent = 'Click me!';
        });
        
        document.querySelectorAll('.scroll-indicator').forEach(indicator => {
            indicator.classList.remove('completed');
        });
        
        document.getElementById('up-scrolls').textContent = '0';
        document.getElementById('down-scrolls').textContent = '0';
        
        document.getElementById('smoothness-score').textContent = '-';
        document.getElementById('jitter-score').textContent = '-';
        
        document.getElementById('best-time').textContent = '-';
        document.getElementById('avg-time').textContent = '-';
        
        document.getElementById('hold-time').textContent = '-';
        
        document.getElementById('polling-rate').textContent = '-';
        document.getElementById('polling-countdown').textContent = '10';
        
        // Clear canvas
        const canvas = document.getElementById('tracking-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset drag elements completely
        const dragSource = document.getElementById('drag-source');
        dragSource.classList.remove('dragging');
        dragSource.style.position = 'static';
        dragSource.style.left = '';
        dragSource.style.top = '';
        dragSource.style.zIndex = '';
        dragSource.style.display = 'block';
        dragSource.style.transform = '';
        
        document.getElementById('drag-target').classList.remove('drag-over', 'dropped');
        
        // Reset click target
        document.getElementById('click-target').classList.remove('clicked');
        
        // Show welcome screen
        this.showScreen('welcome-screen');
    }

    shareResults() {
        // Update share card with current results
        this.updateShareCard();
        
        // Show the share modal
        document.getElementById('share-modal').classList.add('active');
        
        // Bind modal events
        this.bindModalEvents();
    }

    updateShareCard() {
        const totalScore = Object.values(this.testScores).reduce((a, b) => a + b, 0);
        
        // Update share card scores
        document.getElementById('share-score').textContent = totalScore;
        document.getElementById('share-button-score').textContent = `${this.testScores.button}/15`;
        document.getElementById('share-scroll-score').textContent = `${this.testScores.scroll}/15`;
        document.getElementById('share-tracking-score').textContent = `${this.testScores.tracking}/20`;
        document.getElementById('share-doubleclick-score').textContent = `${this.testScores.doubleclick}/15`;
        document.getElementById('share-drag-score').textContent = `${this.testScores.drag}/15`;
        document.getElementById('share-polling-score').textContent = `${this.testScores.polling}/20`;
        
        // Update assessment
        let assessmentText = '';
        if (totalScore >= 80) {
            assessmentText = 'Your mouse is in excellent condition!';
        } else if (totalScore >= 50) {
            assessmentText = 'Your mouse has some wear or issues present.';
        } else {
            assessmentText = 'Your mouse may need replacement or repair.';
        }
        document.getElementById('share-assessment').textContent = assessmentText;
    }

    bindModalEvents() {
        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('share-modal').classList.remove('active');
        });
        
        // Close modal when clicking outside
        document.getElementById('share-modal').addEventListener('click', (e) => {
            if (e.target.id === 'share-modal') {
                document.getElementById('share-modal').classList.remove('active');
            }
        });
        
        // Copy image to clipboard
        document.getElementById('copy-image').addEventListener('click', () => {
            this.copyImageToClipboard();
        });
        
        // Download image
        document.getElementById('download-image').addEventListener('click', () => {
            this.downloadImage();
        });
        
        // Social media sharing
        document.getElementById('share-twitter').addEventListener('click', () => {
            this.shareToTwitter();
        });
        
        document.getElementById('share-facebook').addEventListener('click', () => {
            this.shareToFacebook();
        });
        
        document.getElementById('share-whatsapp').addEventListener('click', () => {
            this.shareToWhatsApp();
        });
    }

    async copyImageToClipboard() {
        try {
            const canvas = await this.generateShareImage();
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                    this.showToast('Image copied to clipboard! 📋');
                } catch (err) {
                    this.showToast('Copy failed. Try downloading instead.');
                }
            });
        } catch (err) {
            this.showToast('Failed to generate image.');
        }
    }

    async downloadImage() {
        try {
            const canvas = await this.generateShareImage();
            const link = document.createElement('a');
            link.download = `mouse-health-score-${this.testScores.button + this.testScores.scroll + this.testScores.tracking + this.testScores.doubleclick + this.testScores.drag + this.testScores.polling}.png`;
            link.href = canvas.toDataURL();
            link.click();
            this.showToast('Image downloaded! 💾');
        } catch (err) {
            this.showToast('Download failed. Please try again.');
        }
    }

    async generateShareImage() {
        return new Promise((resolve) => {
            const shareCard = document.getElementById('share-card');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = 600;
            canvas.height = 800;
            
            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw card background
            ctx.fillStyle = '#f8f8f8';
            ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
            
            // Draw header
            ctx.fillStyle = '#000000';
            ctx.fillRect(20, 20, canvas.width - 40, 80);
            
            // Header text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('🖱 Mouse Health Test', canvas.width / 2, 55);
            ctx.font = '20px Inter';
            ctx.fillText('Performance Report', canvas.width / 2, 80);
            
            // Score circle
            const centerX = canvas.width / 2;
            const centerY = 180;
            const radius = 60;
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            const totalScore = Object.values(this.testScores).reduce((a, b) => a + b, 0);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(totalScore.toString(), centerX, centerY + 10);
            ctx.font = '14px Inter';
            ctx.fillText('Mouse Health Score', centerX, centerY + 35);
            
            // Breakdown scores
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 20px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Test Breakdown:', 40, 320);
            
            const tests = [
                { name: 'Button Test', score: this.testScores.button, max: 15 },
                { name: 'Scroll Test', score: this.testScores.scroll, max: 15 },
                { name: 'Pointer Tracking', score: this.testScores.tracking, max: 20 },
                { name: 'Double-Click Speed', score: this.testScores.doubleclick, max: 15 },
                { name: 'Drag & Drop', score: this.testScores.drag, max: 15 },
                { name: 'Polling Rate', score: this.testScores.polling, max: 20 }
            ];
            
            let yPos = 360;
            tests.forEach(test => {
                ctx.font = '16px Inter';
                ctx.fillStyle = '#000000';
                ctx.fillText(test.name, 40, yPos);
                
                ctx.font = 'bold 16px Inter';
                ctx.textAlign = 'right';
                ctx.fillText(`${test.score}/${test.max}`, canvas.width - 40, yPos);
                
                yPos += 30;
            });
            
            // Assessment
            ctx.textAlign = 'center';
            ctx.font = 'bold 18px Inter';
            ctx.fillStyle = '#000000';
            
            let assessmentText = '';
            if (totalScore >= 80) {
                assessmentText = 'Your mouse is in excellent condition!';
            } else if (totalScore >= 50) {
                assessmentText = 'Your mouse has some wear or issues present.';
            } else {
                assessmentText = 'Your mouse may need replacement or repair.';
            }
            
            // Word wrap for assessment
            const words = assessmentText.split(' ');
            let line = '';
            let lineY = yPos + 40;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > canvas.width - 80) {
                    ctx.fillText(line, centerX, lineY);
                    line = word + ' ';
                    lineY += 25;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, centerX, lineY);
            
            // Footer
            ctx.font = '14px Inter';
            ctx.fillStyle = '#666666';
            ctx.fillText('Test your mouse at mousetest.com', centerX, canvas.height - 40);
            
            resolve(canvas);
        });
    }

    shareToTwitter() {
        const totalScore = Object.values(this.testScores).reduce((a, b) => a + b, 0);
        const text = `🎯 My Mouse Health Score: ${totalScore}/100! Test your mouse performance with this awesome tool!`;
        const url = window.location.href;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
    }

    shareToFacebook() {
        const url = window.location.href;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank');
    }

    shareToWhatsApp() {
        const totalScore = Object.values(this.testScores).reduce((a, b) => a + b, 0);
        const text = `🎯 My Mouse Health Score: ${totalScore}/100! Test your mouse at: ${window.location.href}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000000;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    addSkipButton(testName, onSkip) {
        // Remove any existing skip buttons first
        const existingSkipButtons = document.querySelectorAll('.skip-button');
        existingSkipButtons.forEach(button => button.remove());
        
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip Test';
        skipButton.className = 'skip-button';
        skipButton.addEventListener('click', () => {
            onSkip();
        });

        // Find the current test step element to insert the button
        const currentStepElement = document.getElementById(this.getTestStepId(this.currentStep));
        if (currentStepElement) {
            currentStepElement.appendChild(skipButton);
        }
    }

    getTestStepId(stepIndex) {
        switch (stepIndex) {
            case 0: return 'button-test';
            case 1: return 'scroll-test';
            case 2: return 'pointer-test';
            case 3: return 'doubleclick-test';
            case 4: return 'drag-test';
            case 5: return 'polling-test';
            default: return '';
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MouseHealthTest();
});
