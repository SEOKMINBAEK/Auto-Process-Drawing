<template>
  <q-page class="flex flex-center">
    <div id="공정도"></div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const namespace = '연결관계도면'; // 네임스페이스 설정
  const graph = new joint.dia.Graph({}, { cellNamespace: namespace }); // 그래프 생성
  const gridSize = 20; // 격자 크기 설정

  const paper = new joint.dia.Paper({ // 페이퍼 생성
    el: document.getElementById('공정도'), // 페이퍼를 표시할 엘리먼트 지정
    model: graph, // 그래프 연결
    width: 1000, // 페이퍼 너비 설정
    height: 1000, // 페이퍼 높이 설정
    gridSize: gridSize, // 격자 크기 설정
    drawGrid: { // 격자 표시
      name: 'mesh', // 그리드 스타일을 'mesh'로 설정
      args: { // 그리드 스타일의 세부 설정
        color: 'lightgray', // 그리드 색상 설정
        thickness: 1 // 그리드 선 두께 설정
      }
    },
    snapLinks: { radius: gridSize }, // 링크 스냅 설정 (격자 단위에 자동으로 붙음)
    snapToGrid: true, // 격자에 스냅
    linkPinning: false, // 링크가 격자에 맞춰지도록 설정
    defaultLink: new joint.shapes.standard.Link({ // 기본 링크 설정
      attrs: { line: { stroke: 'black', strokeWidth: 2 } }, // 링크 속성 설정
      router: { name: 'manhattan' }, // 맨하탄 라우터 설정
    }),
    cellViewNamespace: namespace, // 셀뷰 네임스페이스 설정
  });

  시설데이터.forEach((시설) => {
    const { id, label, position, size } = 시설;

    const rect = new joint.shapes.standard.Rectangle({ // 엘리먼트 생성
      id: id, // 아이디 설정
      position: position, // 위치 설정
      size: size, // 크기 설정
      attrs: { // 속성 설정
        body: { // 바디 속성 설정
          fill: 'blue',
        },
        // label: { // 라벨 속성 설정
        //   text: label,
        //   fill: 'white',
        // }
        label: {
          fontSize: "calc(h/4)", // 폰트 크기 높이의 1/4
          text: label, // 텍스트 설정
          fill: 'white', // 색상 설정
          textWrap: { // 텍스트 랩 설정
            width: -10, // 너비 설정
            ellipsis: true // 생략 부호 설정
          }
        }
      }
    });

    rect.addTo(graph); // 그래프에 추가
  })

  연결관계데이터.forEach((연결관계) => {
    const { source, target } = 연결관계;

    const link = new joint.shapes.standard.Link({ // 링크 생성
      source: { id: source }, // 소스 설정
      target: { id: target }, // 타겟 설정
      router: { name: 'manhattan' } // 직각 설정
    });

    link.addTo(graph); // 그래프에 추가
  })

  paper.on('link:pointerdown', (linkView) => { // 링크 클릭 시 이벤트
    const tools = new joint.dia.ToolsView({ // 링크도구 생성
      tools: [ // 도구 설정
        new joint.linkTools.Vertices(), // 버텍스 도구
        // new joint.linkTools.SourceAnchor(), // 소스 앵커 도구
        // new joint.linkTools.TargetAnchor(), // 타겟 앵커 도구
        new joint.linkTools.Segments(), // 세그먼트 도구(링크의 선분)
        new joint.linkTools.Boundary(), // 바운더리 도구(경로 주변의 경계)
        new joint.linkTools.Remove(), // 삭제 도구
      ],
    });
    linkView.addTools(tools); // 링크에 도구 추가
  });

  paper.on('element:pointerdown', (elementView) => { // 엘리먼트 클릭 시 이벤트
    const connectRight = new joint.elementTools.Connect({ // 오른쪽 연결 도구 생성
      x: "100%",
      y: "50%",
      markup: getMarkup(0, "path"),
    });
    const connectBottom = new joint.elementTools.Connect({ // 아래쪽 연결 도구 생성
      x: "50%",
      y: "100%",
      markup: getMarkup(90, "path"),
    });
    const connectTop = new joint.elementTools.Connect({ // 위쪽 연결 도구 생성
      x: "50%",
      y: "0%",
      markup: getMarkup(270, "path"),
    });
    const connectLeft = new joint.elementTools.Connect({ // 왼쪽 연결 도구 생성
      x: "0%",
      y: "50%",
      markup: getMarkup(180, "path"),
    });
    const ResizeTool = joint.elementTools.Control.extend({
      children: [
        {
          tagName: "circle", // 원 태그
          selector: "handle", // 핸들 선택자
          attributes: { // 버튼 속성 설정
            r: 7, // 반지름 설정
            fill: "#4666E5", // 색상 설정
            stroke: "#FFFFFF", // 테두리 색상
            cursor: "pointer" // 커서 설정
          }
        },
      ],
      getPosition: function (view) {
        const model = view.model; //
        const { width, height } = model.size();
        return { x: width, y: height };
      },
      setPosition: function (view, coordinates) {
        const model = view.model; // 모델 가져오기
        const newWidth = Math.max(coordinates.x - 10, 1); // 새 너비 설정
        const newHeight = Math.max(coordinates.y - 10, 1); // 새 높이 설정
        const snappedWidth = Math.round(newWidth / gridSize) * gridSize; // 그리드 맞춤 너비
        const snappedHeight = Math.round(newHeight / gridSize) * gridSize; // 그리드 맞춤 높이
        model.resize(snappedWidth, snappedHeight); // 리사이즈
      }
    });

    const tools = new joint.dia.ToolsView({ // 엘리먼트 도구 생성
      tools: [ // 도구 설정
        new joint.elementTools.Boundary(), // 바운더리 도구(엘리먼트 주변의 경계)
        new joint.elementTools.Remove(), // 삭제 도구
        new ResizeTool(),
        connectRight, // 오른쪽 연결 도구
        connectBottom, // 아래쪽 연결 도구
        connectTop, // 위쪽 연결 도구
        connectLeft, // 왼쪽 연결 도구
      ]
    });
    elementView.addTools(tools); // 엘리먼트에 도구 추가
  });

  paper.on('blank:pointerdown', () => { // 빈 공간 클릭 시 이벤트
    paper.removeTools(); // 모든 도구 제거
  });
});

const 시설데이터 = [
  { id: 'A', label: 'A', position: { x: 100, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'B', label: 'B', position: { x: 300, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'C', label: 'C', position: { x: 500, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'D', label: 'D', position: { x: 700, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'E', label: 'E', position: { x: 900, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'F', label: 'E', position: { x: 100, y: 160 }, size: { width: 120, height: 80 } },
];

const 연결관계데이터 = [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'A', target: 'E' },
  { source: 'B', target: 'D' },
  { source: 'C', target: 'E' },
  { source: 'D', target: 'E' },
];

const getMarkup = (angle = 0, tagname = "path") => { // 아이콘 마크업 생성
  return [
    {
      tagName: "circle", // 원 태그
      selector: "button", // 버튼 선택자
      attributes: { // 버튼 속성 설정
        r: 7, // 반지름 설정
        fill: "#4666E5", // 색상 설정
        stroke: "#FFFFFF", // 테두리 색상
        cursor: "pointer" // 커서 설정
      }
    },
    {
      tagName: "path", // 경로 태그
      selector: "icon", // 아이콘 선택자
      attributes: { // 아이콘 속성 설정
        transform: `rotate(${angle})`, // 회전 설정
        d: "M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z", // 경로 설정
        fill: "#FFFFFF", // 색상 설정
        stroke: "none", // 테두리 없음
        "stroke-width": 2, // 테두리 두께
        "pointer-events": "none" // 이벤트 무시
      }
    }
  ];
}
</script>

<!--
  manhattan
  링크가 수평 및 수직 선분으로만 구성됩니다.
  링크가 가능한 한 직선으로 유지되며, 필요할 때만 방향을 바꿉니다.
  주로 복잡한 다이어그램에서 링크가 서로 겹치지 않도록 하는 데 유용합니다.
  orthogonal
  링크가 직각으로 꺾이는 경로를 따릅니다.
  링크가 가능한 한 직각으로 유지되며, 필요할 때만 방향을 바꿉니다.
  주로 간단한 다이어그램에서 링크가 깔끔하게 보이도록 하는 데 유용합니다.
-->
