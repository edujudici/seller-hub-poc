<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Share2,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';
import type { Product, MarketplacePlatform } from '~/types/collab';

const store = useCollabStore();

const searchQuery = ref('');
const selectedCategory = ref('all');
const publishingProduct = ref<Product | null>(null);

// Form modal state for publishing
const formPlatform = ref<MarketplacePlatform>('mercadolivre');
const formAccountName = ref('');
const formAdTitle = ref('');
const formPrice = ref(0);
const formError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const categories = computed(() => {
  const cats = new Set<string>();
  store.collaborativeProducts.forEach((p) => cats.add(p.category));
  return Array.from(cats);
});

const filteredProducts = computed(() => {
  return store.collaborativeProducts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCat = selectedCategory.value === 'all' || p.category === selectedCategory.value;
    return matchesSearch && matchesCat;
  });
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const openPublishModal = (product: Product) => {
  publishingProduct.value = product;
  formAdTitle.value = `${product.title} - Envio Rápido Original`;
  formPrice.value = product.suggestedRetailPrice;
  formError.value = null;

  const relevantAccounts = store.myAccounts.filter((acc) => acc.platform === formPlatform.value);
  if (relevantAccounts.length > 0) {
    formAccountName.value = relevantAccounts[0].storeName;
  } else if (store.myAccounts.length > 0) {
    formPlatform.value = store.myAccounts[0].platform;
    formAccountName.value = store.myAccounts[0].storeName;
  } else {
    formAccountName.value = '';
  }
};

const calculatedProfit = computed(() => {
  if (!publishingProduct.value) return 0;
  return Math.max(0, formPrice.value - publishingProduct.value.price);
});

const handlePlatformChange = () => {
  const relevantAccounts = store.myAccounts.filter((acc) => acc.platform === formPlatform.value);
  if (relevantAccounts.length > 0) {
    formAccountName.value = relevantAccounts[0].storeName;
  } else {
    formAccountName.value = '';
  }
};

const submitPublishAd = async () => {
  if (!publishingProduct.value) return;

  if (store.myAccounts.length === 0) {
    formError.value = 'Você precisa conectar pelo menos uma conta de marketplace na aba "Integrações" antes de anunciar.';
    return;
  }

  if (!formAccountName.value) {
    formError.value = `Nenhuma conta conectada para a plataforma ${formPlatform.value}. Acesse "Integrações" para vincular.`;
    return;
  }

  if (formPrice.value <= publishingProduct.value.price) {
    formError.value = `O preço de anúncio deve ser superior ao preço de custo (R$ ${publishingProduct.value.price.toFixed(2)}) para gerar margem de lucro.`;
    return;
  }

  try {
    await store.publishAd({
      sellerId: store.currentSeller.id,
      productId: publishingProduct.value.id,
      platform: formPlatform.value,
      advertisedPrice: Number(formPrice.value),
      platformAccountName: formAccountName.value,
      title: formAdTitle.value,
      status: 'active',
    });

    successMessage.value = `Anúncio publicado com sucesso no ${formPlatform.value.toUpperCase()}!`;
    publishingProduct.value = null;
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err: any) {
    formError.value = err.message || 'Erro ao publicar anúncio.';
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Share2 class="w-6 h-6 text-indigo-400" />
          Catálogo Colaborativo Compartilhado
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Produtos com estoque físico pronto mantido por outros fornecedores parceiros da rede. Anuncie em 1 clique.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <strong class="text-indigo-400">{{ store.collaborativeProducts.length }}</strong> produtos disponíveis
        </span>
      </div>
    </div>

    <!-- Feedback banner -->
    <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
      <CheckCircle2 class="w-5 h-5 flex-shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Filter & Search Bar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="relative md:col-span-2">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar produto, fornecedor ou SKU no catálogo..."
          class="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
        />
      </div>

      <div class="relative">
        <Filter class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <select
          v-model="selectedCategory"
          class="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="all">Todas as Categorias</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="prod in filteredProducts"
        :key="prod.id"
        class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group"
      >
        <div>
          <!-- Image with Supplier Badge -->
          <div class="relative h-48 bg-slate-950 overflow-hidden">
            <img
              :src="prod.imageUrl"
              :alt="prod.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div class="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md rounded-lg text-[11px] font-medium text-slate-300 border border-slate-700/50">
              Fornecedor: <span class="text-indigo-400 font-semibold">{{ prod.ownerName }}</span>
            </div>
            <div class="absolute top-3 right-3 px-2.5 py-1 bg-emerald-950/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-emerald-400 border border-emerald-700/50">
              {{ prod.stock }} em estoque
            </div>
          </div>

          <!-- Product Body -->
          <div class="p-5 space-y-3">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {{ prod.category }} • SKU: {{ prod.sku }}
            </div>
            <h3 class="text-base font-bold text-white leading-snug line-clamp-2">
              {{ prod.title }}
            </h3>
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {{ prod.description }}
            </p>

            <!-- Price Breakdown Box -->
            <div class="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2 mt-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">Custo Fornecedor (Base):</span>
                <span class="font-bold text-slate-200">{{ formatCurrency(prod.price) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">Preço Sugerido Venda:</span>
                <span class="font-semibold text-indigo-300">{{ formatCurrency(prod.suggestedRetailPrice) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
                <span class="text-emerald-400 font-medium flex items-center gap-1">
                  <TrendingUp class="w-3.5 h-3.5" />
                  Margem Estimada:
                </span>
                <span class="font-bold text-emerald-400">
                  {{ formatCurrency(prod.suggestedRetailPrice - prod.price) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="p-5 pt-0">
          <button
            @click="openPublishModal(prod)"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Share2 class="w-4 h-4" />
            Anunciar na Minha Loja
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredProducts.length === 0" class="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
      <Package class="w-10 h-10 text-slate-600 mx-auto" />
      <div class="text-slate-300 font-medium">Nenhum produto encontrado</div>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Tente ajustar seus termos de busca ou mudar a categoria selecionada.
      </p>
    </div>

    <!-- Publish Modal -->
    <div v-if="publishingProduct" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Share2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Criar Anúncio de Cross-Docking</h3>
              <p class="text-xs text-slate-400">Publicação automatizada via Nuxt Server BFF</p>
            </div>
          </div>
          <button @click="publishingProduct = null" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="formError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-medium mb-1">Plataforma Marketplace</label>
            <select
              v-model="formPlatform"
              @change="handlePlatformChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            >
              <option value="mercadolivre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
              <option value="amazon">Amazon Brasil</option>
              <option value="magalu">Magalu</option>
              <option value="shein">Shein Marketplace</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1">Conta Vinculada de Anúncio</label>
            <input
              v-model="formAccountName"
              type="text"
              placeholder="Ex: TechDrop Oficial ML"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1">Título do Anúncio</label>
            <input
              v-model="formAdTitle"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Custo Fornecedor (Base)</label>
              <div class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-bold">
                {{ formatCurrency(publishingProduct.price) }}
              </div>
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">Seu Preço Anunciado (R$)</label>
              <input
                v-model.number="formPrice"
                type="number"
                step="0.10"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- Profit Calculator Summary -->
          <div class="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 flex items-center justify-between">
            <span class="text-indigo-200">Seu Lucro Líquido por Unidade Venda:</span>
            <span class="text-base font-bold text-emerald-400">{{ formatCurrency(calculatedProfit) }}</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            @click="publishingProduct = null"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            @click="submitPublishAd"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20"
          >
            Publicar Anúncio Agora
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
