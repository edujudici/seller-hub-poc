<script setup lang="ts">
import { ref, computed } from 'vue';
import { Layers, ShoppingBag, CheckCircle, Trash2, ExternalLink, Zap, AlertCircle } from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';
import type { Ad } from '~/types/collab';

const store = useCollabStore();

const simulatingSaleAdId = ref<string | null>(null);
const successSaleMessage = ref<string | null>(null);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const getProductForAd = (productId: string) => {
  return store.products.find((p) => p.id === productId);
};

const handleDeleteAd = async (id: string) => {
  if (confirm('Deseja realmente remover este anúncio sincronizado?')) {
    await store.deleteAd(id);
  }
};

const triggerSimulatedSale = async (ad: Ad) => {
  simulatingSaleAdId.value = ad.id;
  try {
    await store.simulateSale(ad, 1);
    successSaleMessage.value = `Venda simulada com sucesso no ${ad.platform.toUpperCase()}! Pedido gerado e estoque debitado via Nuxt Server BFF.`;
    setTimeout(() => {
      successSaleMessage.value = null;
    }, 4500);
  } catch (err: any) {
    alert(`Erro ao simular venda: ${err.message}`);
  } finally {
    simulatingSaleAdId.value = null;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Layers class="w-6 h-6 text-blue-400" />
          Meus Anúncios Publicados nos Marketplaces
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Anúncios sincronizados em suas contas conectadas. Quando uma venda ocorre, o fornecedor do estoque físico é notificado para envio.
        </p>
      </div>

      <button
        @click="store.setActiveTab('catalog')"
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
      >
        <ShoppingBag class="w-4 h-4" />
        Anunciar Mais Produtos do Catálogo
      </button>
    </div>

    <!-- Feedback banner -->
    <div v-if="successSaleMessage" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
      <CheckCircle class="w-5 h-5 flex-shrink-0" />
      <span>{{ successSaleMessage }}</span>
    </div>

    <!-- Ads List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="ad in store.myAds"
        :key="ad.id"
        class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {{ ad.platform }}
            </span>
            <span class="text-xs font-mono text-slate-400 font-medium">
              ID: {{ ad.externalId }}
            </span>
          </div>

          <div>
            <h3 class="text-sm font-bold text-white line-clamp-2 leading-snug">
              {{ ad.title }}
            </h3>
            <div class="text-[11px] text-slate-400 mt-1">
              Conta: <span class="text-slate-300 font-medium">{{ ad.platformAccountName }}</span>
            </div>
          </div>

          <!-- Product Physical Origin Details -->
          <div class="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Preço Anunciado:</span>
              <span class="font-bold text-emerald-400 text-sm">{{ formatCurrency(ad.advertisedPrice) }}</span>
            </div>

            <div v-if="getProductForAd(ad.productId)" class="pt-1.5 border-t border-slate-800 text-[11px] space-y-1">
              <div class="flex justify-between text-slate-400">
                <span>Fornecedor Estoque:</span>
                <span class="text-indigo-300 font-medium">{{ getProductForAd(ad.productId)?.ownerName }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Custo Base do Produto:</span>
                <span class="text-slate-300">{{ formatCurrency(getProductForAd(ad.productId)!.price) }}</span>
              </div>
              <div class="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-850">
                <span>Lucro Estimado por Venda:</span>
                <span>{{ formatCurrency(ad.advertisedPrice - getProductForAd(ad.productId)!.price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Simulation and Action Bar -->
        <div class="pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <button
            @click="triggerSimulatedSale(ad)"
            :disabled="simulatingSaleAdId === ad.id"
            class="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Zap class="w-3.5 h-3.5" />
            <span>{{ simulatingSaleAdId === ad.id ? 'Simulando...' : 'Simular Venda (Webhook)' }}</span>
          </button>

          <button
            @click="handleDeleteAd(ad.id)"
            class="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs transition-colors"
            title="Remover Anúncio"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="store.myAds.length === 0" class="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
      <Layers class="w-10 h-10 text-slate-600 mx-auto" />
      <div class="text-slate-300 font-medium">Você ainda não publicou anúncios</div>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Acesse o Catálogo Colaborativo e publique produtos de outros fornecedores em suas contas de marketplace.
      </p>
      <button
        @click="store.setActiveTab('catalog')"
        class="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
      >
        Explorar Catálogo de Parceiros
      </button>
    </div>
  </div>
</template>
