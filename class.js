(() => {
  const black = 1; // 검은돌은 1
  const white = 2; // 흰돌은 2
  let realBoard = []; // 최종적으로 저장할 바둑판

  function makeCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const BOARD_WIDTH = 700;
    const margin = 30;
    const LINE_COLOR = 'black';
    const CANVAS_WIDTH = BOARD_WIDTH + margin * 2;
    const CANVAS_HEIGHT = CANVAS_WIDTH;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const row = 19; // 바둑판 줄 개수
    const box = row - 1; // 바둑판 칸 개수
    const boxSize = BOARD_WIDTH / box; // 바둑판 한 칸의 너비
    const dolSize = 17; // 바둑돌 크기

    let count = 0;
    let recordPae = {};

    const board = new Array(Math.pow(box + 1, 2)).fill(-1);
    const checkDirection = [
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, 0],
    ];

    // 바둑판 그리기
    function drawBoard() {
      // 바둑판 - 판
      ctx.fillStyle = '#e38d00';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 바둑판 - 줄 (사각형을 12X12로 채우기)
      for (let x = 0; x < box; x++) {
        for (let y = 0; y < box; y++) {
          const w = (CANVAS_WIDTH - margin * 2) / box; // 한칸의 너비
          ctx.strokeStyle = LINE_COLOR;
          ctx.lineWidth = 1;
          ctx.strokeRect(w * x + margin, w * y + margin, w, w);
        }
      }
      ctx.fillStyle = LINE_COLOR;
      ctx.lineWidth = 1;

      // 바둑판 - 화점

      function drawDot(x, y) {
        ctx.fillStyle = LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, dolSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // 귀 화점
      for (let a = 0; a < 2; a++) {
        for (let b = 0; b < 2; b++) {
          drawDot(
            (3 + a) * boxSize + margin + a * (box - 7) * boxSize,
            (3 + b) * boxSize + margin + b * (box - 7) * boxSize
          );
        }
      }
      // 변 화점

      // 중앙 화점
      drawDot(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // 방금 둔 바둑돌에 사각 표시
    const drawRect = (x, y) => {
      let w = boxSize / 2;
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        x * boxSize + margin - w,
        y * boxSize + margin - w,
        w + boxSize / 2,
        w + boxSize / 2
      );
    };

    function drawDol(x, y, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        x * boxSize + margin,
        y * boxSize + margin - 0.2, // 0.2는 보정
        dolSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    //바둑알 그리기. 실제로는 바둑판까지 매번 통째로 그려줌
    const drawBasicDol = () => {
      for (let i = 0; i < board.length; i++) {
        const a = indexToXy(i)[0];
        const b = indexToXy(i)[1];
        if (board[xyToIndex(a, b)] === 1) {
          drawDol(a, b, 'black');
        } else if (board[xyToIndex(a, b)] === 2) {
          drawDol(a, b, 'white');
        }
      }
      // 만들어진 배열이 실패도, 성공도와 같은지 확인하고 그에 따른 대응 출력
    };

    // 배열을 콘솔창에 grid로 보여주는 함수.
    // 코딩하면서 바둑판이 어떻게 그려지는지 콘솔창에서 확인하려는 목적이고, 게임과는 관계 없음.
    function indexView(m) {
      let s = '\n';
      let c = 0;
      for (let e of m) {
        s += `${e} `;
        if (c % box === row) s += '\n'; //줄바꿈 문자 삽입
        c++;
      }
      return s;
    }

    // x,y 좌표를 배열의 index값으로 반환
    const xyToIndex = (x, y) => {
      if (x >= row || x < 0 || y >= row || y < 0) {
        return undefined;
      } else {
        return x + y * row;
      }
    };

    const indexToXy = (i) => {
      const x = i % row;
      const y = Math.floor(i / row);
      return [x, y];
    };

    const onTheBoard = (offsetX, offsetY) => {
      if (
        offsetX > margin - (margin - 10) &&
        offsetX < CANVAS_WIDTH - (margin - 10) &&
        offsetY > margin - (margin - 10) &&
        offsetY < CANVAS_WIDTH - (margin - 10)
      ) {
        return true;
      }
      return false;
    };

    const adjustCoordinate = (x, y) => {
      let a = Math.round(Math.abs(x - margin) / boxSize);
      let b = Math.round(Math.abs(y - margin) / boxSize);
      return [a, b];
    };

    function handleRules(x, y) {
      function wayOutIsZero(x, y, color, makeList = false) {
        let countWayOut = 0;
        const alreadyFound = [];
        let surroundedDols = [];

        function subWayOutIsZero(x, y, color) {
          if (countWayOut) {
            return false;
          }
          for (let k = 0; k < 4; k++) {
            if (countWayOut) {
              return false;
            }
            let a = x + checkDirection[k][0];
            let b = y + checkDirection[k][1];

            if (a < 0 || a >= row || b < 0 || b >= row) {
              continue;
            }
            let checkString = String(a) + '/' + String(b);
            if (alreadyFound.includes(checkString)) {
              continue;
            }
            if (board[xyToIndex(a, b)] === -1) {
              countWayOut += 1;
              return false;
            } else if (board[xyToIndex(a, b)] === color) {
              alreadyFound.push(checkString);
              subWayOutIsZero(a, b, color);
            }
          }
          if (countWayOut) {
            return false;
          }
          if (makeList) {
            surroundedDols.push(xyToIndex(x, y));
          }
          return makeList ? Array.from(new Set(surroundedDols)) : true;
        }
        return subWayOutIsZero(x, y, color);
      }
      function handlePae(x, y, color, dolsToCatch) {
        const surrounding = [];
        for (let k = 0; k < 4; k++) {
          let a = x + checkDirection[k][0];
          let b = y + checkDirection[k][1];
          surrounding.push(board[xyToIndex(a, b)]);
        }

        if (
          dolsToCatch.length === 1 &&
          surrounding.indexOf(color) === -1 &&
          surrounding.indexOf(-1) === -1
        ) {
          const recordXY =
            xyToIndex(x, y) > dolsToCatch[0]
              ? `${xyToIndex(x, y)}/${dolsToCatch[0]}`
              : `${dolsToCatch[0]}/${xyToIndex(x, y)}`;
          const thisCount = count + 1;
          if (recordPae[recordXY] === thisCount - 1) {
            return false;
          } else {
            recordPae[recordXY] = thisCount;
          }
          return true;
        } else {
          return true;
        }
      }
      const thisColor = count % 2 === 0 ? 1 : 2;
      const opponentColor = thisColor === 1 ? 2 : 1;
      let opponentDols = [];
      let dolsToCatch = [];
      // 옆에 상대돌이 있는지 확인
      // 가로,세로 4방향
      for (let k = 0; k < 4; k++) {
        let a = x + checkDirection[k][0];
        let b = y + checkDirection[k][1];
        if (board[xyToIndex(a, b)] === opponentColor) {
          opponentDols.push([a, b]);
        }
      }
      if (opponentDols.length) {
        for (let opponentDol of opponentDols) {
          let lst = wayOutIsZero(
            opponentDol[0],
            opponentDol[1],
            opponentColor,
            true
          );
          if (lst) {
            for (let d of lst) {
              dolsToCatch.push(d);
            }
          }
        }
      } else {
        return wayOutIsZero(x, y, thisColor) ? false : true;
      }
      if (dolsToCatch.length) {
        if (!handlePae(x, y, thisColor, dolsToCatch)) {
          return false;
        }
      } else {
        return wayOutIsZero(x, y, thisColor) ? false : true;
      }
      for (let dolToCatch of dolsToCatch) {
        board[dolToCatch] = -1;
      }
      return true;
    }

    drawBoard();
    drawBasicDol();

    canvas.addEventListener('mouseup', (e) => {
      const x = adjustCoordinate(e.offsetX, e.offsetY)[0];
      const y = adjustCoordinate(e.offsetX, e.offsetY)[1];
      if (onTheBoard(e.offsetX, e.offsetY)) {
        // 이미 돌이 놓여진 자리인지 확인
        if (board[xyToIndex(x, y)] != -1) {
          return;
          // 비어있는 자리이면, 순서에 따라서 흑,백 구분해서 그리는 함수 실행
        } else {
          count % 2 === 0
            ? (board[xyToIndex(x, y)] = black)
            : (board[xyToIndex(x, y)] = white);
        }

        if (!handleRules(x, y)) {
          board[xyToIndex(x, y)] = -1;
          return;
        }
        realBoard = board;
        count++;
        drawBoard();
        drawBasicDol(x, y);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (onTheBoard(e.offsetX, e.offsetY)) {
        let x = adjustCoordinate(e.offsetX, e.offsetY)[0];
        let y = adjustCoordinate(e.offsetX, e.offsetY)[1];
        if (board[xyToIndex(x, y)] !== -1) {
          drawBoard();
          drawBasicDol();
        } else {
          if (count % 2 === 0) {
            drawBoard();
            drawBasicDol();
            drawDol(x, y, 'rgba(0,0,0,0.5)');
          } else {
            drawBoard();
            drawBasicDol();
            drawDol(x, y, 'rgba(255,255,255,0.5)');
          }
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      drawBoard();
      drawBasicDol();
    });
    // window.addEventListener('keydown', (e) => {
    //   if(e.keyCode === 37){
    //     if(recordBoard.length > 1){
    //       board = recordBoard[recordBoard.length - 2];
    //       recordBoard.pop()
    //       drawBoard();
    //       drawBasicDol();
    //     }
    //   }
    // })
  }
  const canvas = document.querySelector('.canvas');
  makeCanvas(canvas, 19);
})();
