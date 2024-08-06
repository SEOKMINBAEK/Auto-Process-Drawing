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

  const { 시설계층도, 시설연결관계 } = 계층도및연결관계생성();
  console.log({ 시설계층도, 시설연결관계 });

  시설도형생성(graph, 시설계층도);
  시설도형배치(graph, 시설계층도, 시설연결관계);
  시설전후단연결(graph, 시설연결관계);
})

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
  })
};


const 시설도형배치 = (graph, 시설계층도, 시설연결관계) => {
  시설계층도 = 시설계층도.filter((계층) => 계층.length > 0); // 빈 계층 제거
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
      router: { name: 'manhattan' } // 직각 설정
    });

    link.addTo(graph); // 그래프에 추가
  })
}

const 도형넓이 = 100;
const 도형높이 = 40;
const x축간격 = 100;
const y축간격 = 60;

const ROOT = { id: '#A201003' };

const 계층도및연결관계생성 = () => {
  const 시설계층도 = [[ROOT]];
  const 시설연결관계 = [];
  const 탐색한시설 = [];
  const 추가된시설 = new Set([ROOT.id]);

  const 전단시설불러오기 = (TARGET = ROOT.id, depth = 1) => {
    탐색한시설.push(TARGET);
    const 연결된전단시설 = 연결관계데이터[TARGET] || [];
    console.log({TARGET, depth, 연결된전단시설})
    if (연결된전단시설.length) { // 전단 시설이 있으면

      if (!시설계층도[depth]) { 시설계층도[depth] = [] }; // 해당 계층에 배열이 없으면 생성

      const 중복제거된시설 = 차집합(연결된전단시설, 추가된시설); // 이미 추가된시설 제외
      시설계층도[depth].push(...중복제거된시설); // 해당 계층에 시설 추가
      연결된전단시설.forEach(({ id }) => 추가된시설.add(id)); // 추가된시설에 추가

      연결된전단시설.forEach(({ id }) => {
        console.log({ id }, 추가된시설.has(id));
        시설연결관계.push({ source: id, target: TARGET }); // 연결관계 데이터 추가
        if (탐색한시설.includes(id)) {
          return;
        } else {
          전단시설불러오기(id, depth + 1);
        }

      });
    } else {
      return;
    }
  }
  전단시설불러오기();

  return { 시설계층도, 시설연결관계 };
}

const 차집합 = (연결된전단시설, 추가된시설) => { // 연결된전단시설 - 추가된시설
  return 연결된전단시설.filter(({ id }) => !추가된시설.has(id));
}

const 연결관계데이터 = {
  '#A201003': [{ id: 'C-RST1005' }, { id: 'C-RST1006' }],
  'C-RST1005': [{ id: 'I-RST1030' }, { id: 'I-RST1031' }, { id: 'I-RST1032' }, { id: 'I-RST1033' }],
  'C-RST1006': [{ id: 'I-RST1033' }, { id: 'I-RST1034' }, { id: 'I-RST1035' }],
  // 'I-RST1035': [{ id: 'C-RST1005' }],
};
</script>
