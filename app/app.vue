<template>
  <div class="bg-slate-50 min-h-screen">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useCollabStore } from '~/stores/collab';

const store = useCollabStore();

// Hydrate store data from LocalStorage or simulate REST API
onMounted(() => {
  console.log('[CollabMarket APP] App mounted successfully. Initializing local data store...');
  try {
    store.initStore();
    console.log('[CollabMarket APP] initStore() triggered successfully.');
    console.log('[CollabMarket APP] Active Seller Profile in session:', store.currentSeller ? `${store.currentSeller.name} (@${store.currentSeller.storeName})` : 'None');
  } catch (error) {
    console.error('[CollabMarket APP] Critical failure during initial store hydration:', error);
  }
});
</script>
