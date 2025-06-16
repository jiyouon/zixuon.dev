# 정보과학 프로세싱 미로찾기 게임 수정 수행평가

int[][] maze = {
  {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1},                         
  {1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1},                         
  {1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1},                         
  {1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1},                         
  {1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},                         
  {1, 1, 1, 0, 5, 0, 0, 0, 5, 0, 1, 1, 1},                         
  {1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1}, 
  {1, 0, 1, 1, 0, 0, 3, 0, 0, 1, 1, 0, 1},
  {1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1},
  {1, 0, 4, 0, 1, 0, 0, 0, 1, 0, 4, 0, 1},
  {1, 0, 3, 4, 0, 1, 1, 1, 0, 4, 3, 0, 1},
  {1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1},
  {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}                          
};

int px = 1, py = 1;
int moveCount = 0;                                  
int maxMoves = 60;     
boolean gameOver = false;
boolean success = false;                           

void setup(){
  size(650, 650);                                   
}

void draw(){
  background(255);

  for (int y = 0; y < 13; y++){                      
    for (int x = 0; x < 13; x++){                    
      if (maze[y][x] == 1) fill(0);                
      else if (maze[y][x] == 2) fill(#F5FBFF);    
      else if (maze[y][x] == 3) fill(#F6FF03);  
      else if (maze[y][x] == 4) fill(#FFADAD);  
      else if (maze[y][x] == 5) fill(#7CC7FF);
      else fill(255);                               
      rect(x * 50, y * 50, 50, 50);
    }
  }

  // 플레이어
  fill(#959595);
  rect(px * 50, py * 50, 50, 50);

  // 정보 표시
  fill(255);                                       
  textSize(14);                                    
  text("remaining tile: " + (maxMoves - moveCount), 10, 20); 

  // 메시지 출력
  if (success) {                                    
    fill(#03FF2E);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("SUCCESS!", width / 2, height / 2);
    noLoop();
  } else if (gameOver) {                            
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2);
    noLoop();
  }
}

void keyPressed(){
  if (gameOver || success) return;                 

  int nx = px;
  int ny = py;

  if (keyCode == UP) ny--;
  if (keyCode == DOWN) ny++;
  if (keyCode == LEFT) nx--;
  if (keyCode == RIGHT) nx++;

  if (nx < 0 || ny < 0 || nx >= 13 || ny >= 13) return; 

  int tile = maze[ny][nx];                         

  if (tile == 1) return;

  else if (tile == 3) {                             
    px = 1;
    py = 1;
    moveCount++;
  }
  else if (tile == 4) {                             
    px = nx;
    py = ny;
    moveCount += 5;
  }
  else if (tile == 5) {                             
    px = nx;
    py = ny;
    moveCount++;
    gameOver = true;
  }
  else {
    px = nx;
    py = ny;
    moveCount++;
  }

  if (maze[py][px] == 2) success = true;            
  if (moveCount >= maxMoves) gameOver = true;      
}
