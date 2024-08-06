<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Auto Process Drawing
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item v-for="link in linkData" clickable v-ripple :key="link.label" @click="navigateTo(link.to)">
          <q-item-section>
            <q-item-label>
              {{ link.label }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const leftDrawerOpen = ref(false);

const linkData = [
  {
    label: 'AutoDraw',
    to: '/auto'
  },
  {
    label: 'EditDraw',
    to: '/edit'
  },
  {
    label: 'positionTest',
    to: '/position-test'
  },
  {
    label: 'positionTest2',
    to: '/position-test2'
  }
]

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const navigateTo = (path) => {
  router.push(path);
}
</script>
