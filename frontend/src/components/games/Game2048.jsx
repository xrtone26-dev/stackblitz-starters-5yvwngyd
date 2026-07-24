class Game2048 {
  constructor(canvas, soundEngine, updateUI) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.sound = soundEngine;
      this.updateUI = updateUI;

      this.gridSize = 4;
      this.grid = [];
      this.score = 0;
      this.bestScore = parseInt(localStorage.getItem('best2048') || '0');
      this.moves = 0;
      this.time = 0;
      this.timerInterval = null;
      this.isGameOver = false;

      this.setupInput();
  }

  start() {
      this.grid = Array(this.gridSize).fill(0).map(() => Array(this.gridSize).fill(0));
      this.score = 0;
      this.moves = 0;
      this.time = 0;
      this.isGameOver = false;
      this.addRandomTile();
      this.addRandomTile();

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
          this.time++;
          this.updateUI({ score: this.score, moves: this.moves, time: this.time });
      }, 1000);

      this.render();
  }

  addRandomTile() {
      let empty = [];
      for (let r = 0; r < this.gridSize; r++) {
          for (let c = 0; c < this.gridSize; c++) {
              if (this.grid[r][c] === 0) empty.push({ r, c });
          }
      }
      if (empty.length > 0) {
          let { r, c } = empty[Math.floor(Math.random() * empty.length)];
          this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
      }
  }

  setupInput() {
      window.addEventListener('keydown', (e) => {
          if (this.isGameOver) return;
          let moved = false;
          if (e.key === 'ArrowUp') moved = this.moveUp();
          if (e.key === 'ArrowDown') moved = this.moveDown();
          if (e.key === 'ArrowLeft') moved = this.moveLeft();
          if (e.key === 'ArrowRight') moved = this.moveRight();

          if (moved) {
              this.addRandomTile();
              this.moves++;
              this.sound.play('card');
              this.render();
              this.checkGameOver();
          }
      });
  }

  slide(row) {
      let arr = row.filter(val => val !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
              arr[i] *= 2;
              this.score += arr[i];
              arr[i + 1] = 0;
          }
      }
      arr = arr.filter(val => val !== 0);
      while (arr.length < this.gridSize) arr.push(0);
      return arr;
  }

  moveLeft() {
      let prev = JSON.stringify(this.grid);
      for (let r = 0; r < this.gridSize; r++) {
          this.grid[r] = this.slide(this.grid[r]);
      }
      return JSON.stringify(this.grid) !== prev;
  }

  moveRight() {
      let prev = JSON.stringify(this.grid);
      for (let r = 0; r < this.gridSize; r++) {
          let rev = this.grid[r].slice().reverse();
          rev = this.slide(rev);
          this.grid[r] = rev.reverse();
      }
      return JSON.stringify(this.grid) !== prev;
  }

  moveUp() {
      let prev = JSON.stringify(this.grid);
      for (let c = 0; c < this.gridSize; c++) {
          let col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
          col = this.slide(col);
          for (let r = 0; r < this.gridSize; r++) this.grid[r][c] = col[r];
      }
      return JSON.stringify(this.grid) !== prev;
  }

  moveDown() {
      let prev = JSON.stringify(this.grid);
      for (let c = 0; c < this.gridSize; c++) {
          let col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]].reverse();
          col = this.slide(col).reverse();
          for (let r = 0; r < this.gridSize; r++) this.grid[r][c] = col[r];
      }
      return JSON.stringify(this.grid) !== prev;
  }

  checkGameOver() {
      if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem('best2048', this.bestScore);
      }
      // Verificar si hay movimientos disponibles
      for (let r = 0; r < this.gridSize; r++) {
          for (let c = 0; c < this.gridSize; c++) {
              if (this.grid[r][c] === 0) return;
              if (c < 3 && this.grid[r][c] === this.grid[r][c + 1]) return;
              if (r < 3 && this.grid[r][c] === this.grid[r + 1][c]) return;
          }
      }
      this.isGameOver = true;
      clearInterval(this.timerInterval);
      this.sound.play('win');
  }

  render() {
      this.ctx.fillStyle = '#bbada0';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const tileSize = 100;
      const spacing = 12;
      const startX = (this.canvas.width - (this.gridSize * tileSize + (this.gridSize - 1) * spacing)) / 2;
      const startY = (this.canvas.height - (this.gridSize * tileSize + (this.gridSize - 1) * spacing)) / 2;

      const tileColors = {
          0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
          16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
          256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
      };

      for (let r = 0; r < this.gridSize; r++) {
          for (let c = 0; c < this.gridSize; c++) {
              let val = this.grid[r][c];
              let x = startX + c * (tileSize + spacing);
              let y = startY + r * (tileSize + spacing);

              this.ctx.fillStyle = tileColors[val] || '#3c3a32';
              this.ctx.beginPath();
              this.ctx.roundRect(x, y, tileSize, tileSize, 8);
              this.ctx.fill();

              if (val > 0) {
                  this.ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2';
                  this.ctx.font = 'bold 36px Outfit';
                  this.ctx.textAlign = 'center';
                  this.ctx.textBaseline = 'middle';
                  this.ctx.fillText(val, x + tileSize / 2, y + tileSize / 2);
              }
          }
      }
  }
}