<template>
  <q-page>
    <q-card>
      <q-card-section>
        <div class="text-h6">파일 업로드</div>
      </q-card-section>

      <q-card-section>
        <q-file
          v-model="files"
          label="파일을 선택하세요"
          filled
          multiple
          @change="onFileChange"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" @click="uploadFiles">업로드</q-btn>
      </q-card-actions>
    </q-card>
    <q-card>
      <q-card-section>
        <div class="text-h6">선택ㅋ</div>
      </q-card-section>
      <q-card-section>
        <q-select
          v-model="selected"
          :options="options"
          label="도면정보"
          filled
        />
      </q-card-section>
      <q-card-section>
        <q-radio v-model="필터링옵션" val="source" label="전단만" />
        <q-radio v-model="필터링옵션" val="target" label="후단만" />
        <q-radio v-model="필터링옵션" val="직전후" label="직전후" />
        <q-radio v-model="필터링옵션" val="all" label="다갖고와" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" @click="도면그리기">그리기</q-btn>
      </q-card-actions>
    </q-card>
    <div style="width: 1000px; height: 600px; overflow-x: auto;">
      <div id="공정도" style="position: relative"></div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

const files = ref([]);
const 도면정보 = ref([]);
const 필터링도면정보 = ref([]);
const 시설리스트 = ref([]);
const 필터링시설리스트 = ref([]);
const 필터링옵션 = ref(null);
const selected = ref(null);
const options = ref([]);

const onFileChange = (fileList) => {
  console.log('선택된 파일:', fileList);
};

const uploadFiles = async () => {
  console.time('파일 업로드 시간');

  if (files.value.length === 0) {
    console.log('업로드할 파일이 없습니다.');
    throw new Error('No files to upload');
  }

  const file = files.value[0]; // 단일 파일 처리
  const reader = new FileReader();

  도면정보.value = await new Promise((resolve, reject) => {
    reader.onload = (event) => {
      try {
        const decoder = new TextDecoder('euc-kr'); // 인코딩을 euc-kr로 지정 / 이거 설정 안하면 한글 다깨짐
        const text = decoder.decode(event.target.result);
        const workbook = XLSX.read(text, { type: 'string' });

        // 첫 번째 시트 가져오기
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 시트를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  console.timeEnd('파일 업로드 시간');
  console.log({ 도면정보: 도면정보.value });

  시설리스트.value = 시설리스트생성(도면정보.value);
  options.value = ['다가져오기', ...시설리스트.value.map((item) => item.id)];
};

const 도면그리기 = () => {
  console.time('도면 그리기 시간');
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
    padding: { top: 20, left: 20, bottom: 20, right: 20 },
    defaultLink: new joint.shapes.standard.Link({ // 기본 링크 설정
      attrs: { line: { stroke: 'black', strokeWidth: 2 } }, // 링크 속성 설정
      router: { name: 라우터 }, // 맨하탄 라우터 설정
    }),
  });

  console.log(selected.value);
  필터링도면정보.value = 도면필터링(selected.value, 필터링옵션.value);
  필터링시설리스트.value = 시설리스트생성(필터링도면정보.value);

  if (selected.value === '다가져오기') {
    시설도형생성(graph, 시설리스트.value);
    시설전후단연결(graph, 도면정보.value);
    시설자동배치(시설리스트.value, 도면정보.value);
    updatePaperSize(graph, paper);
  } else {
    시설도형생성(graph, 필터링시설리스트.value);
    시설전후단연결(graph, 필터링도면정보.value);
    시설자동배치(필터링시설리스트.value, 필터링도면정보.value);
    updatePaperSize(graph, paper);
  }

  console.timeEnd('도면 그리기 시간');
}

const 도면필터링 = (ROOT, 필터링옵션) => {
  const queue = [ROOT];
  const filtered도면정보 = [];
  const 처리됨 = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    if (처리됨.has(current)) continue;
    처리됨.add(current);

    if (필터링옵션 === 'source') { // 전단만 불러오기
      const 전단시설리스트 = 도면정보.value.filter((item) => item.후단시설번호 === current);
      filtered도면정보.push(...전단시설리스트);

      queue.push(...전단시설리스트.map((item) => item.전단시설번호));
    } else if (필터링옵션 === 'target') { // 후단만 불러오기
      const 후단시설리스트 = 도면정보.value.filter((item) => item.전단시설번호 === current);
      filtered도면정보.push(...후단시설리스트);

      queue.push(...후단시설리스트.map((item) => item.후단시설번호));
    } else if (필터링옵션 === '직전후') {
      const 전단시설리스트 = 도면정보.value.filter((item) => item.후단시설번호 === current);
      const 후단시설리스트 = 도면정보.value.filter((item) => item.전단시설번호 === current);

      filtered도면정보.push(...전단시설리스트);
      filtered도면정보.push(...후단시설리스트);
    } else { // 전단, 후단 모두 불러오기
      const 전단시설리스트 = 도면정보.value.filter((item) => item.후단시설번호 === current);
      const 후단시설리스트 = 도면정보.value.filter((item) => item.전단시설번호 === current);

      filtered도면정보.push(...전단시설리스트);
      filtered도면정보.push(...후단시설리스트);

      queue.push(...전단시설리스트.map((item) => item.전단시설번호));
      queue.push(...후단시설리스트.map((item) => item.후단시설번호));
    }
  }

  console.log('filtered도면정보:', filtered도면정보);

  return filtered도면정보;
}

const 시설리스트생성 = (도면정보) => {
  const set = new Set();
  도면정보.forEach((data) => {
    const { 전단시설번호, 후단시설번호 } = data;

    set.add(전단시설번호);
    set.add(후단시설번호);
  });

  const result = [...set].map((시설) => {
    return {
      id: 시설,
    };
  });

  return [...result];
};

const 시설도형생성 = (graph, 시설리스트) => {
  console.log('시설리스트:', 시설리스트);

  시설리스트.forEach((시설) => {
    const { id } = 시설;
    const rect = new joint.shapes.standard.Rectangle({
      id: id,
      position: { x: 0, y: 0 },
      size: { width: 도형넓이, height: 도형높이 },
      attrs: {
        body: {
          fill: 'lightgray',
        },
        label: {
          text: id,
          fill: 'black',
        },
      },
    });
    rect.addTo(graph); // 그래프에 추가
    시설.el = rect; // 시설객체에 엘리먼트 추가
  })
};


const 시설자동배치 = (시설리스트, 도면정보) => { // Dagre 레이아웃 설정
  const dagreGraph = new dagre.graphlib.Graph(); // Dagre 그래프 생성
  dagreGraph.setGraph({ rankdir: 'LR' }); // 그래프 설정
  dagreGraph.setDefaultEdgeLabel(() => ({})); // 엣지 라벨 설정

  시설리스트.forEach(시설 => {
    dagreGraph.setNode(시설.id, { width: 100, height: 40 }); // 노드 크기 설정
  });

  도면정보.forEach(link => {
    dagreGraph.setEdge(link.전단시설번호, link.후단시설번호); // 엣지 설정
  });

  dagre.layout(dagreGraph); // Dagre 레이아웃 적용

  const padding = { top: 20, left: 20, bottom: 20, right: 20 }; // 패딩 값 가져오기

  dagreGraph.nodes().forEach((id, idx) => {
    console.log({id, idx})
    const node = dagreGraph.node(id); // 노드 정보 가져오기
    const jointNode = 시설리스트.find(n => n.id === id).el; // JointJS 노드 가져오기
    jointNode.position(
      node.x - node.width / 2 + padding.left, // 패딩을 고려하여 x 위치 조정
      node.y - node.height / 2 + padding.top // 패딩을 고려하여 y 위치 조정
    );
  });
}

const 시설전후단연결 = (graph, 도면정보) => {
  // 자동 배치된 노드 기준으로 링크 연결
  도면정보.forEach(연결관계 => {
    const { 전단시설번호, 후단시설번호 } = 연결관계;

    const link = new joint.shapes.standard.Link({ // 링크 생성
      source: { id: 전단시설번호 }, // 소스 설정
      target: { id: 후단시설번호 }, // 타겟 설정
      router: { name: 'manhattan' } // 직각 설정
    });

    link.addTo(graph); // 그래프에 추가
    });
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

</script>
