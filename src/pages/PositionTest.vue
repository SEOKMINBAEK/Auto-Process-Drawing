<template>
  <q-page class="flex flex-center">
    <div id="공정도"></div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // JointJS 그래프와 페이퍼 설정
  const graph = new joint.dia.Graph();

  const paper = new joint.dia.Paper({
    el: document.getElementById('공정도'), // 페이퍼를 표시할 엘리먼트 지정
    model: graph, // 그래프 연결
    width: 1000, // 페이퍼 너비 설정
    height: 1000, // 페이퍼 높이 설정
    gridSize: 1, // 격자 크기 설정
    background: { // 배경 설정
      color: 'skyblue' // 배경 색상 설정
    },
    defaultLink: new joint.shapes.standard.Link({ // 기본 링크 설정
      attrs: { line: { stroke: 'black', strokeWidth: 2 } }, // 링크 속성 설정
      router: { name: 'manhattan' }, // 맨하탄 라우터 설정
    }),
  });

  // 계층분류도에 따른 시설 노드들 자동 배치
  const 계층분류도 = 시설계층분류(연결관계);

  시설도형생성(graph, 시설데이터);
  시설도형배치(graph, 계층분류도);
  시설전후단연결(graph, 연결관계);
})

const 시설도형생성 = (graph, 시설데이터) => {
  시설데이터.forEach((시설) => {
    const { id } = 시설;

    const rect = new joint.shapes.standard.Rectangle({ // 엘리먼트 생성
      id: id, // 아이디 설정
      position: { x: 0, y: 0 }, // 위치 설정
      size: { width: 100, height: 40 }, // 크기 설정
      attrs: { // 속성 설정
        body: { // 바디 속성 설정
          fill: 'lightgray'
        },
        label: { // 라벨 속성 설정
          text: id,
          fill: 'black'
        }
      },
    });

    시설.el = rect; // 시설객체에 엘리먼트 추가
    rect.addTo(graph); // 그래프에 추가
  });
}

const 시설도형배치 = (graph, 계층분류도) => {
  계층분류도.forEach((계층, index) => {
    const x좌표 = 100 + (도형넓이 + x축간격) * index;

    계층.forEach((시설, index) => {
      const 전단시설목록 = 계층분류도[index - 1];

      const 현재시설의전단시설목록 = 연결관계
        .filter(({ target }) => target === 시설)
        .map(({ source }) => source);

      let y좌표 = 100 + (도형높이 + y축간격) * index;

      if (현재시설의전단시설목록.length) {
        const 첫번째전단시설노드 = graph.getCell(현재시설의전단시설목록[0]);
        y좌표 = 첫번째전단시설노드.position().y;
      }
      const 시설노드 = graph.getCell(시설);
      시설노드.position(x좌표, y좌표);
    });
  })
}

const 시설전후단연결 = (graph, 연결관계) => {
  // 자동 배치된 노드 기준으로 링크 연결
  연결관계.forEach((관계) => {
    const { source, target } = 관계;

    const link = new joint.shapes.standard.Link({ // 링크 생성
      source: { id: source }, // 소스 설정
      target: { id: target }, // 타겟 설정
      router: { name: 'manhattan' } // 직각 설정
    });

    link.addTo(graph); // 그래프에 추가
  })
}

const 시설계층분류 = (연결관계) => {
  // 부모-자식 관계 맵 만들기
  const 관계도맵 = {};
  const 전체시설 = new Set();
  const 후단시설 = new Set();

  연결관계.forEach(({source, target}) => {
    if (!관계도맵[source]) {
      관계도맵[source] = [];
    }
    관계도맵[source].push(target);
    전체시설.add(source);
    전체시설.add(target);
    후단시설.add(target);
  });

  // 최상위 소스 찾기 (다른 노드의 타겟이 되지 않는 소스)
  const 최상위전단시설 = [...전체시설].filter(node => !후단시설.has(node));

  // 계층별로 시설을 저장할 배열
  const 계층분류도 = [];

  // BFS를 사용하여 계층별로 분리
  const queue = 최상위전단시설.map(전단시설 => ({ node: 전단시설, level: 0 })); // 최초 최상위 계층을 큐에 추가
  while (queue.length > 0) { // 큐가 빌 때까지 반복
    const { node, level } = queue.shift();

    if (!계층분류도[level]) { // 해당 계층에 배열이 없으면 생성
      계층분류도[level] = [];
    }
    계층분류도[level].push(node); // 해당 계층에 시설 추가
    계층분류도[level] = [...new Set(계층분류도[level])]; // 중복된 시설 제거

    if (관계도맵[node]) { // 후단 시설이 있으면 큐에 추가
      관계도맵[node].forEach(child => { // 후단 시설을 큐에 추가
        queue.push({ node: child, level: level + 1 }); // 계층을 증가시켜서 큐에 추가
      });
    }
  }

  return 계층분류도;
}

const 도형넓이 = 100;
const 도형높이 = 40;
const x축간격 = 100;
const y축간격 = 60;

const 시설데이터 = [
  {
    id: '#A201003',
  },
  {
    id: 'C-RST1005',
  },
  {
    id: 'C-RST1006',
  },
  {
    id: 'I-RST1030',
  },
  {
    id: 'I-RST1031',
  },
  {
    id: 'I-RST1032',
  },
  {
    id: 'I-RST1033',
  },
  {
    id: 'I-RST1034',
  },
  {
    id: 'I-RST1035',
  },
];

const 연결관계 = [
  {
    source: 'I-RST1030',
    target: 'C-RST1005',
  },
  {
    source: 'I-RST1031',
    target: 'C-RST1005',
  },
  {
    source: 'I-RST1032',
    target: 'C-RST1005',
  },
  {
    source: 'I-RST1033',
    target: 'C-RST1005',
  },
  {
    source: 'I-RST1034',
    target: 'C-RST1006',
  },
  {
    source: 'I-RST1035',
    target: 'C-RST1006',
  },
  {
    source: 'C-RST1005',
    target: '#A201003',
  },
  {
    source: 'C-RST1006',
    target: '#A201003',
  },
];
</script>
