<template>
  <q-page class="flex flex-center">
    <div id="공정도"></div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';

defineOptions({
  name: 'IndexPage'
});

onMounted(() => {
    // JointJS 그래프와 페이퍼 설정
    const graph = new joint.dia.Graph();

    const paper = new joint.dia.Paper({
        el: document.getElementById('공정도'), // 페이퍼를 표시할 엘리먼트 지정
        model: graph, // 그래프 연결
        width: 1000, // 페이퍼 너비 설정
        height: 1000, // 페이퍼 높이 설정
        gridSize: 1, // 격자 크기 설정
        defaultLink: new joint.shapes.standard.Link({ // 기본 링크 설정
        attrs: { line: { stroke: 'black', strokeWidth: 2 } }, // 링크 속성 설정
        router: { name: 'manhattan' }, // 맨하탄 라우터 설정
      }),
    });

    시설데이터.forEach((시설) => {
      const { id, label } = 시설;

      const rect = new joint.shapes.standard.Rectangle({ // 엘리먼트 생성
        id: 시설.id, // 아이디 설정
        position: { x: 100, y: 30 }, // 위치 설정
        size: { width: 100, height: 40 }, // 크기 설정
        attrs: { // 속성 설정
          body: { // 바디 속성 설정
            fill: 'lightgray'
          },
          label: { // 라벨 속성 설정
            text: 시설.label,
            fill: 'black'
          }
        },
      });

      시설.el = rect; // 시설객체에 엘리먼트 추가
      rect.addTo(graph); // 그래프에 추가
    });

    연결관계데이터.forEach(연결관계 => {
      const { source, target } = 연결관계;

      const link = new joint.shapes.standard.Link({ // 링크 생성
        source: { id: source }, // 소스 설정
        target: { id: target }, // 타겟 설정
        router: { name: 'manhattan' } // 직각 설정
      });

      link.addTo(graph); // 그래프에 추가
    });

    const applyDagreLayout = () => { // Dagre 레이아웃 설정
      const dagreGraph = new dagre.graphlib.Graph(); // Dagre 그래프 생성
      dagreGraph.setGraph({}); // 그래프 설정
      dagreGraph.setDefaultEdgeLabel(() => ({})); // 엣지 라벨 설정

      시설데이터.forEach(node => {
        dagreGraph.setNode(node.id, { width: 100, height: 40 }); // 노드 크기 설정
      });

      연결관계데이터.forEach(link => {
        dagreGraph.setEdge(link.source, link.target); // 엣지 설정
      });

      dagre.layout(dagreGraph); // Dagre 레이아웃 적용

      dagreGraph.nodes().forEach(id => {
        const node = dagreGraph.node(id); // 노드 정보 가져오기
        const jointNode = 시설데이터.find(n => n.id === id).el; // JointJS 노드 가져오기
        jointNode.position(node.x - node.width / 2, node.y - node.height / 2); // 노드 위치 설정
      });
    }

    applyDagreLayout(); // Dagre 레이아웃 적용
})

const 시설데이터 = [
  { id: 'A', label: 'A', position: { x: 100, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'B', label: 'B', position: { x: 300, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'C', label: 'C', position: { x: 500, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'D', label: 'D', position: { x: 700, y: 40 }, size: { width: 120, height: 80 } },
  { id: 'E', label: 'E', position: { x: 900, y: 40 }, size: { width: 120, height: 80 } }
];

const 연결관계데이터 = [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'A', target: 'E' },
  { source: 'B', target: 'D' },
  { source: 'C', target: 'E' },
  { source: 'D', target: 'E' },
];
</script>
