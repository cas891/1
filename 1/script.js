// 贪吃蛇游戏主逻辑
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartBtn = document.getElementById('restartBtn');
        this.pauseBtn = document.getElementById('pauseBtn');

        // 游戏配置
        this.canvasSize = 400;
        this.gridSize = 20;
        this.gridCount = this.canvasSize / this.gridSize;

        // 游戏状态
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false; // 新增：暂停状态
        this.gameSpeed = 200; // 调慢初始速度（原来是150）

        // 初始化
        this.initEventListeners();
        this.loadHighScore();
        this.showStartScreen();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 移动端按钮控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.target.dataset.direction;
                this.changeDirection(direction);
            });
        });

        // 重新开始按钮
        this.restartBtn.addEventListener('click', () => this.restart());

        // 暂停按钮
        this.pauseBtn.addEventListener('click', () => this.togglePause());

        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // 触摸滑动控制（移动端）
        let startX, startY;
        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 30) this.changeDirection('left');
                else if (diffX < -30) this.changeDirection('right');
            } else {
                if (diffY > 30) this.changeDirection('up');
                else if (diffY < -30) this.changeDirection('down');
            }
        });
    }

    // 显示开始屏幕
    showStartScreen() {
        this.draw();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('按方向键开始游戏', this.canvasSize/2, this.canvasSize/2);
        this.ctx.fillText('或点击按钮', this.canvasSize/2, this.canvasSize/2 + 40);
    }

    // 处理键盘按键
    handleKeyPress(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            let direction;
            switch(e.code) {
                case 'ArrowUp':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                    direction = 'right';
                    break;
            }
            this.changeDirection(direction);
        } else if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
        }
    }

    // 改变方向
    changeDirection(dir) {
        if (this.gamePaused) return; // 暂停时不能改变方向
        
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        const currentDir = Object.keys(this.direction).find(key => 
            this.direction[key] !== 0) || '';

        if (opposites[currentDir] === dir) return;

        // 设置方向
        switch(dir) {
            case 'up':
                this.direction = {x: 0, y: -1};
                break;
            case 'down':
                this.direction = {x: 0, y: 1};
                break;
            case 'left':
                this.direction = {x: -1, y: 0};
                break;
            case 'right':
                this.direction = {x: 1, y: 0};
                break;
        }

        // 如果游戏未开始，则开始游戏
        if (!this.gameRunning) {
            this.start();
        }
    }

    // 开始游戏
    start() {
        this.gameRunning = true;
        this.gameLoop();
    }

    // 游戏主循环
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        setTimeout(() => {
            this.update();
            this.draw();
            this.gameLoop();
        }, this.gameSpeed);
    }

    // 更新游戏状态
    update() {
        const head = {...this.snake[0]};
        
        // 移动蛇头
        head.x += this.direction.x;
        head.y += this.direction.y;

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            
            // 适度加速游戏（调慢加速）
            if (this.gameSpeed > 120) { // 调慢最低速度限制（原来是80）
                this.gameSpeed -= 1; // 减少加速度（原来是2）
            }
        } else {
            this.snake.pop();
        }
    }

    // 检查碰撞
    checkCollision(head) {
        // 撞墙
        if (head.x < 0 || head.x >= this.gridCount || 
            head.y < 0 || head.y >= this.gridCount) {
            return true;
        }

        // 撞自己
        return this.snake.some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    // 生成食物
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gridCount),
                y: Math.floor(Math.random() * this.gridCount)
            };
        } while (this.snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        ));
        return food;
    }

    // 绘制游戏
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        // 绘制网格（可选）
        this.drawGrid();

        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }

    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvasSize);
            this.ctx.stroke();

            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvasSize, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    // 绘制蛇
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            if (index === 0) {
                // 蛇头 - 改进视觉效果
                this.ctx.fillStyle = '#38a169';
                this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // 蛇头边框
                this.ctx.strokeStyle = '#2f855a';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // 蛇头眼睛 - 改进设计
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(x + 6, y + 6, 3, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + 14, y + 6, 3, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // 眼睛瞳孔
                this.ctx.fillStyle = '#2d3748';
                this.ctx.beginPath();
                this.ctx.arc(x + 6, y + 6, 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + 14, y + 6, 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
            } else {
                // 蛇身 - 渐变效果
                const alpha = Math.max(0.4, 1 - (index * 0.1)); // 越后面越透明
                this.ctx.fillStyle = `rgba(72, 187, 120, ${alpha})`;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                
                // 蛇身边框
                this.ctx.strokeStyle = `rgba(56, 161, 105, ${alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            }
        });
    }

    // 绘制食物
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;

        // 绘制食物为红色圆形 - 改进视觉效果
        // 主色
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize/2, 
            y + this.gridSize/2, 
            this.gridSize/2 - 2, 
            0, 
            2 * Math.PI
        );
        this.ctx.fill();

        // 食物高光效果
        this.ctx.fillStyle = '#feb2b2';
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize/2 - 4, 
            y + this.gridSize/2 - 4, 
            5, 
            0, 
            2 * Math.PI
        );
        this.ctx.fill();

        // 食物边框
        this.ctx.strokeStyle = '#c53030';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize/2, 
            y + this.gridSize/2, 
            this.gridSize/2 - 2, 
            0, 
            2 * Math.PI
        );
        this.ctx.stroke();
    }

    // 更新分数
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            this.saveHighScore();
        }
    }

    // 加载最高分
    loadHighScore() {
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.highScoreElement.textContent = this.highScore;
    }

    // 保存最高分
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore);
    }

    // 游戏结束
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
    }

    // 切换暂停/恢复
    togglePause() {
        if (!this.gameRunning) return; // 游戏未开始时不能暂停
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.pauseBtn.textContent = '▶️'; // 切换到播放图标
            this.pauseBtn.previousElementSibling.textContent = '继续';
            this.showPauseScreen();
        } else {
            this.pauseBtn.textContent = '⏸️'; // 切换到暂停图标
            this.pauseBtn.previousElementSibling.textContent = '暂停';
            this.gameLoop(); // 恢复游戏循环
        }
    }

    // 显示暂停屏幕
    showPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏已暂停', this.canvasSize/2, this.canvasSize/2 - 20);
        this.ctx.font = '18px Arial';
        this.ctx.fillText('按空格键或点击按钮继续', this.canvasSize/2, this.canvasSize/2 + 20);
    }

    // 重新开始
    restart() {
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.gamePaused = false; // 重置暂停状态
        this.gameSpeed = 200; // 重置速度
        this.pauseBtn.textContent = '⏸️'; // 重置按钮图标
        this.pauseBtn.previousElementSibling.textContent = '暂停';
        this.scoreElement.textContent = '0';
        this.gameOverElement.classList.add('hidden');
        this.showStartScreen();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});