(() => {
  const canvas = document.getElementById('jsCanvas');
  const ctx = canvas.getContext('2d');

  const BOARD_WIDTH = 600;
  const margin = 30;
  const LINE_COLOR = 'black';
  const CANVAS_WIDTH = BOARD_WIDTH + margin * 2;
  const CANVAS_HEIGHT = CANVAS_WIDTH;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const row = 19; // 바둑판 줄 개수
  const box = row - 1; // 바둑판 칸 개수
  const boxSize = BOARD_WIDTH / box; // 바둑판 한 칸의 너비
  const dolSize = 13; // 바둑돌 크기
  const black = 1; // 검은돌은 1
  const white = 2; // 흰돌은 2
  let count = 0;
  let recordPae = {};

  let board = new Array(Math.pow(box + 1, 2)).fill(-1);

  // 상하좌우 네 방향 확인
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

    // 화점 그리기

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

  // 방금 둔 바둑돌에 사각 표시 (적용 안함)
  drawRect = (x, y) => {
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

  // 바둑돌 그리기 (방금 둔 돌)
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

  //바둑돌 그리기(원래 있던 돌) 실제로는 바둑판까지 매번 통째로 그려줌
  const drawBasicDol = (x, y) => {
    for (let i = 0; i < board.length; i++) {
      const a = indexToXy(i)[0];
      const b = indexToXy(i)[1];
      if (board[xyToIndex(a, b)] === 1) {
        drawDol(a, b, 'black');
      } else if (board[xyToIndex(a, b)] === 2) {
        drawDol(a, b, 'white');
      }
    }
    // 만들어진 배열이 실패도, 성공도와 같은지 확인하고 그에 따른 대응 출력 (아직 구현 안함)
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
      // 바둑판 범위를 벗어나면 undefined 반환
      return undefined;
    } else {
      return x + y * row;
    }
  };

  // index를 x,y 값으로 반환
  const indexToXy = (i) => {
    x = i % row;
    y = Math.floor(i / row);
    return [x, y];
  };

  // 클릭한 지점이 바둑판 유효범위 안인지 검사
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

  // 클릭한 위치 보정
  const adjustCoordinate = (x, y) => {
    let a = Math.floor(Math.abs(x - margin) / boxSize);
    let b = Math.floor(Math.abs(y - margin) / boxSize);
    return [a, b];
  };

  // 룰 적용
  function handleRules(x, y) {
    // 활로가 0인지 확인 + 매개변수 makeList가 true면 돌들의 위치를 list에 push (따낼 때 사용)
    function wayOutIsZero(x, y, color, makeList = false) {
      let countWayOut = 0;
      const alreadyFound = [];
      let surroundedDols = [];

      // 재귀함수로 구현 (활로가 보이면 바로 return false, 마지막까지 가면 return true)
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
    // 패 처리 함수 (x,y 좌표, 둔 돌 색깔, 잡을 돌 매개변수로 전달)
    function handlePae(x, y, color, dolsToCatch) {
      const surrounding = [];
      for (let k = 0; k < 4; k++) {
        let a = x + checkDirection[k][0];
        let b = y + checkDirection[k][1];
        surrounding.push(board[xyToIndex(a, b)]);
      }

      // 때린 돌이 하나고 둔 돌과 연결된 돌이 없고 둔 돌의 활로가 없으면 패
      if (
        dolsToCatch.length === 1 &&
        surrounding.indexOf(color) === -1 &&
        surrounding.indexOf(-1) === -1
      ) {
        // 패가 맞으면 recordPae obj에 둔 돌 인덱스/따낼 돌 인덱스: count 형식으로 저장
        // 이 때 상대가 뒀을 때랑 다를 수 있기 때문에 큰 수가 앞으로 ㄱㄱ
        const recordXY =
          xyToIndex(x, y) > dolsToCatch[0]
            ? `${xyToIndex(x, y)}/${dolsToCatch[0]}`
            : `${dolsToCatch[0]}/${xyToIndex(x, y)}`;
        const thisCount = count + 1;
        // 검사했을 때 value가 1차이나면 return false(팻감 안 쓰고 때림)
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
    // 옆에 상대돌이 있는지 확인 + 있으면 리스트에 push
    // 가로,세로 4방향
    for (let k = 0; k < 4; k++) {
      let a = x + checkDirection[k][0];
      let b = y + checkDirection[k][1];
      if (board[xyToIndex(a, b)] === opponentColor) {
        opponentDols.push([a, b]);
      }
    }
    // 상대돌이 있으면 그중에 활로가 0인돌(따낼 돌) dolsToCatch에 push
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
      // 상대돌이 없으면 착수금지 여부 확인
    } else {
      return wayOutIsZero(x, y, thisColor) ? false : true;
    }
    // 따낼 돌이 있으면 패 처리 -> 팻감 안쓰고 때리면 return false (착수금지)
    if (dolsToCatch.length) {
      if (!handlePae(x, y, thisColor, dolsToCatch)) {
        return false;
      }
      // 따낼 돌이 없으면 착수금지 여부 확인
    } else {
      return wayOutIsZero(x, y, thisColor) ? false : true;
    }
    // 마지막으로, 잡은 돌 판에서 드러내기
    for (let dolToCatch of dolsToCatch) {
      board[dolToCatch] = -1;
    }
    return true;
  }

  // 시작하면 빈 바둑판 그리기
  drawBoard();

  canvas.addEventListener('mouseup', (e) => {
    let x = adjustCoordinate(e.offsetX, e.offsetY)[0];
    let y = adjustCoordinate(e.offsetX, e.offsetY)[1];
    if (onTheBoard(e.offsetX, e.offsetY)) {
      // 이미 돌이 놓여진 자리인지 확인
      if (board[xyToIndex(x, y)] != -1) {
        return;
        // 비어있는 자리이면, 순서에 따라서 흑,백 구분해서 그리는 함수 실행
      } else {
        count % 2 === 0
          ? (board[xyToIndex(x, y)] = 1)
          : (board[xyToIndex(x, y)] = 2);
      }
      // 룰에 위반되면(착수금지면) 아무것도 실행하지 않음
      if (!handleRules(x, y)) {
        board[xyToIndex(x, y)] = -1;
        return;
      }
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
})();
