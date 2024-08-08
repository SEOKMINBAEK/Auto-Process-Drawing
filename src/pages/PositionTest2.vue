<template>
  <q-page style="width: 100vw; height: 100vh; overflow-x: scroll;">
    <div id="공정도" style="position: relative"></div>
    <q-btn id="업로드" color="primary" @click="svg업로드">SVG 업로드</q-btn>
    <q-btn id="업로드" color="primary" @click="svg다운로드">SVG 다운로드</q-btn>
    <div id="공정도2" style="position: relative; width: 1000px; height: 1000px;"></div>
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
    width: 컨테이너너비, // 페이퍼 너비 설정
    height: 컨테이너높이, // 페이퍼 높이 설정
    gridSize: 1, // 격자 크기 설정
    background: { // 배경 설정
      color: 'skyblue' // 배경 색상 설정
    },
    defaultLink: new joint.shapes.standard.Link({ // 기본 링크 설정
      attrs: { line: { stroke: 'black', strokeWidth: 2 } }, // 링크 속성 설정
      router: { name: 라우터 }, // 맨하탄 라우터 설정
    }),
  });

  // const { 시설계층도, 시설연결관계 } = 계층도및연결관계생성();
  const { 시설계층도, 시설연결관계 } = 계층도및연결관계생성();
  console.log({ 시설계층도, 시설연결관계 });

  graph.on('change:position add remove', () => updatePaperSize(graph, paper));

  시설도형생성(graph, 시설계층도);
  시설도형배치(graph, 시설계층도, 시설연결관계);
  시설전후단연결(graph, 시설연결관계);
})

const svg업로드 = () => {
  const svg = document.querySelector('#공정도 > svg');
  const svgString = new XMLSerializer().serializeToString(svg); // xml 데이터로 직렬화 -> 문자열로 변환
  localStorage.setItem('svg', svgString);
}

const svg다운로드 = () => {
  const svg = localStorage.getItem('svg'); // xml 문자열 가져오기
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml'); // xml 문자열 파싱 -> DOM 문서 객체 생성 (MIME 타입 지정)
  const svgElement = doc.documentElement;
  console.log(svgElement);
  const 공정도2 = document.getElementById('공정도2');
  공정도2.innerHTML = ''; // 기존 내용을 지우기
  공정도2.appendChild(svgElement);
  localStorage.removeItem('svg');
}

const 시설도형생성 = (graph, 시설계층도) => {
  시설계층도.forEach((계층) => {
    계층.forEach((시설) => {
      const { id } = 시설;

      const rect = new joint.shapes.standard.Rectangle({ // 엘리먼트 생성
        id: id, // 아이디 설정
        position: { x: 0, y: 0 }, // 위치 설정
        size: { width: 100, height: 40 }, // 크기 설정
        attrs: { // 속성 설정
          body: { // 바디 속성 설정
            fill: 'lightgray',
            'data-test': 'test', // <g> 태그 안에 <rect> 요소에 data-attrubute 추가
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
  })
};

const 시설도형배치 = (graph, 시설계층도, 시설연결관계) => {
  시설계층도.reverse(); // 계층 역순으로 정렬

  시설계층도.forEach((계층, index) => {
    const x좌표 = 100 + (도형넓이 + x축간격) * index; // x좌표 설정

    계층.forEach((시설, index) => {
      const 전단시설목록 = 시설계층도[index - 1];

      const 현재시설의전단시설목록 = 시설연결관계
        .filter(({ target }) => target === 시설)
        .map(({ source }) => source);

      let y좌표 = 100 + (도형높이 + y축간격) * index; // y좌표 설정

      if (현재시설의전단시설목록.length) {
        const 첫번째전단시설노드 = graph.getCell(현재시설의전단시설목록[0]);
        // y좌표 = 첫번째전단시설노드.position().y; // 첫번째 전단 시설의 y좌표로 설정
      }
      const 시설노드 = graph.getCell(시설);
      시설노드.position(x좌표, y좌표);
    });
  })
}

const 시설전후단연결 = (graph, 시설연결관계) => {
  // 자동 배치된 노드 기준으로 링크 연결
  시설연결관계.forEach((관계) => {
    const { source, target } = 관계;

    const link = new joint.shapes.standard.Link({ // 링크 생성
      source: { id: source }, // 소스 설정
      target: { id: target }, // 타겟 설정
      router: { name: 라우터, args: 라우터옵션 }, // 직각 설정 // metro 옵션은 직선으로 교차점 회피
      attr: {
        line: {
          stroke: 'black',
          strokeWidth: 2,
        },
      }
    });

    link.addTo(graph); // 그래프에 추가
  })
}

const updatePaperSize = (graph, paper) => { // 그래프의 요소가 변경될 때마다 paper 크기 업데이트
  const elements = graph.getElements();
  if (elements.length === 0) return;

  const boundingBox = elements.reduce((bbox, element) => {
    const elementBBox = element.getBBox();
    return bbox.union(elementBBox);
  }, elements[0].getBBox());

  const newWidth = Math.max(boundingBox.width + 200, 컨테이너너비);
  const newHeight = Math.max(boundingBox.height + 200, 컨테이너높이);

  paper.setDimensions(newWidth, newHeight);
};

const 컨테이너높이 = 1000;
const 컨테이너너비 = 1000;
const 라우터 = 'manhattan'; // normal, manhattan, metro, orthogonal, oneSide, rightAngle
const 라우터옵션 = {
  step: 10, // 그리드사이즈와 맞추기
}
const 도형넓이 = 100;
const 도형높이 = 40;
const x축간격 = 100;
const y축간격 = 60;

const ROOT = { id: '#A201003' };

const 계층도및연결관계생성 = () => {
  const 시설계층도 = [[ROOT]];
  const 시설연결관계 = [];
  const 추가된시설 = new Set([ROOT.id]); // 큐에 이미 추가된 시설 id 집합
  const 큐 = [{ target: ROOT.id, depth: 1 }]; // 큐에 ROOT 추가

  while (큐.length > 0) {
    const { target, depth } = 큐.shift(); // 큐에서 하나 꺼내기
    const 연결된전단시설 = 연결관계데이터[target] || []; // 연결된 전단 시설 가져오기

    console.log({큐, target, 연결된전단시설, 시설계층도})

    if (연결된전단시설.length) { // 전단 시설이 있으면
      if (!시설계층도[depth]) { 시설계층도[depth] = [] }; // 해당 계층에 배열이 없으면 생성

      연결된전단시설.forEach(({ id }) => { // 구조상 모든 연결관계는 고유할 수 밖에 없다. 큐에 이미 추가되었더라도 연결관계는 추가될 수 있기 때문에 중복제거된시설을 기준으로 삼지 않는다.
        시설연결관계.push({ source: id, target }); // 연결관계 데이터 추가
        추가된시설.has(id) || 큐.push({ target: id, depth: depth + 1 }); // 이미 추가된 시설이 아니면 큐에 추가
      });
      const 중복제거된시설 = 연결된전단시설.filter(({ id }) => !추가된시설.has(id)); // 이미 추가된 시설 제외

      if (중복제거된시설.length) {
        시설계층도[depth].push(...중복제거된시설); // 해당 계층에 시설 추가
        중복제거된시설.forEach(({ id }) => 추가된시설.add(id)); // 추가된 시설에 추가
      } else {
        시설계층도[depth].length || 시설계층도.splice(depth, 1); // 해당 계층이 비어있으면 제거
      }

    }
  }

  return { 시설계층도, 시설연결관계 };
}

const 연결관계데이터 = {
  '#A201003': [{ id: 'C-RST1005' }, { id: 'C-RST1006' }],
  'C-RST1005': [{ id: 'I-RST1030' }, { id: 'I-RST1031' }, { id: 'I-RST1032' }, { id: 'I-RST1033' }, { id: 'I-RST1034' }, { id: 'C-RST1006' }],
  'C-RST1006': [{ id: 'C-RST1005' }, { id: 'I-RST1030' }, { id: 'I-RST1033' }, { id: 'I-RST1034' }, { id: 'I-RST1035' }],
  // 'I-RST1034': [{ id: 'C-RST1005' }],
};

// const 연결관계데이터 = {
//   '#A201003': [{ id: 'C-RST1005' }],
//   'C-RST1005': [{ id: 'C-RST1006' }],
//   'C-RST1006': [{ id: 'I-RST1030' }],
//   'I-RST1030': [{ id: 'I-RST1031' }],
//   'I-RST1031': [{ id: 'I-RST1032' }],
//   'I-RST1032': [{ id: 'I-RST1033' }],
//   'I-RST1033': [{ id: 'I-RST1034' }],
//   'I-RST1034': [{ id: 'I-RST1035' }],
// };
</script>
