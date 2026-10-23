<script setup lang="ts">
import { ref } from 'vue';
import { Package, Plus, Save, Edit3, Trash2, HelpCircle, Check, AlertCircle } from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';
import { ProductSchema } from '~/utils/validation';
import type { Product } from '~/types/collab';

const store = useCollabStore();

const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref<string | null>(null);
const formError = ref<string | null>(null);

const form = ref({
  title: '',
  description: '',
  price: 0,
  suggestedRetailPrice: 0,
  stock: 0,
  category: 'Eletrônicos',
  imageUrl: '',
  sku: '',
});

const openNewModal = () => {
  isEditing.value = false;
  currentId.value = null;
  formError.value = null;
  form.value = {
    title: '',
    description: '',
    price: 0,
    suggestedRetailPrice: 0,
    stock: 10,
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  showModal.value = true;
};

const openEditModal = (p: Product) => {
  isEditing.value = true;
  currentId.value = p.id;
  formError.value = null;
  form.value = {
    title: p.title,
    description: p.description,
    price: p.price,
    suggestedRetailPrice: p.suggestedRetailPrice,
    stock: p.stock,
    category: p.category,
    imageUrl: p.imageUrl,
    sku: p.sku,
  };
  showModal.value = true;
};

const submitForm = async () => {
  try {
    formError.value = null;
    ProductSchema.parse(form.value);

    if (isEditing.value && currentId.value) {
      await store.updateProduct(currentId.value, {
        title: form.value.title,
        description: form.value.description,
        price: Number(form.value.price),
        suggestedRetailPrice: Number(form.value.suggestedRetailPrice),
        stock: Number(form.value.stock),
        category: form.value.category,
        imageUrl: form.value.imageUrl,
        sku: form.value.sku,
      });
    } else {
      await store.createProduct({
        title: form.value.title,
        description: form.value.description,
        price: Number(form.value.price),
        suggestedRetailPrice: Number(form.value.suggestedRetailPrice),
        stock: Number(form.value.stock),
        category: form.value.category,
        imageUrl: form.value.imageUrl,
        sku: form.value.sku,
      });
    }

    showModal.value = false;
  } catch (err: any) {
    if (err.errors && err.errors.length > 0) {
      formError.value = err.errors[0].message;
    } else {
      formError.value = err.message || 'Erro ao salvar produto';
    }
  }
};

const handleDelete = async (id: string) => {
  if (confirm('Deseja realmente remover este produto do seu estoque compartilhado?')) {
    await store.deleteProduct(id);
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Package class="w-6 h-6 text-purple-400" />
          Meu Estoque Próprio (Fornecimento)
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Produtos físicos que você possui em seu armazém e disponibiliza para parceiros venderem no ecossistema.
        </p>
      </div>

      <button
        @click="openNewModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
      >
        <Plus class="w-4 h-4" />
        Cadastrar Novo Produto
      </button>
    </div>

    <!-- Products List Table / Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="p in store.myProducts"
        :key="p.id"
        class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
      >
        <div>
          <div class="relative h-44 bg-slate-950">
            <img :src="p.imageUrl" :alt="p.title" class="w-full h-full object-cover" />
            <div class="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-300">
              SKU: {{ p.sku }}
            </div>
            <div class="absolute top-3 right-3 px-2.5 py-1 bg-purple-950/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-purple-300 border border-purple-700/50">
              {{ p.stock }} un. em estoque
            </div>
          </div>

          <div class="p-5 space-y-2">
            <div class="text-[11px] font-semibold text-slate-500 uppercase">{{ p.category }}</div>
            <h3 class="text-base font-bold text-white leading-snug line-clamp-1">{{ p.title }}</h3>
            <p class="text-xs text-slate-400 line-clamp-2">{{ p.description }}</p>

            <div class="grid grid-cols-2 gap-2 pt-3 text-xs">
              <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 block">Preço de Repasse</span>
                <span class="font-bold text-purple-400">{{ formatCurrency(p.price) }}</span>
              </div>
              <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 block">Sugerido Venda</span>
                <span class="font-bold text-slate-200">{{ formatCurrency(p.suggestedRetailPrice) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 pt-0 flex items-center gap-2">
          <button
            @click="openEditModal(p)"
            class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit3 class="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            @click="handleDelete(p.id)"
            class="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.myProducts.length === 0" class="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
      <Package class="w-10 h-10 text-slate-600 mx-auto" />
      <div class="text-slate-300 font-medium">Você ainda não cadastrou produtos próprios</div>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Cadastre seus produtos para que outros parceiros possam anunciar e gerar vendas para seu estoque.
      </p>
      <button
        @click="openNewModal"
        class="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
      >
        Cadastrar Primeiro Produto
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-base font-bold text-white">
            {{ isEditing ? 'Editar Produto do Estoque' : 'Cadastrar Novo Produto' }}
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="formError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-medium mb-1">Título do Produto</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Ex: Fone Bluetooth True Wireless"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1">Descrição Completa</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Descreva detalhes, especificações e diferenciais do item..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Preço de Repasse (Atacado)</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.10"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">Preço Sugerido Venda</label>
              <input
                v-model.number="form.suggestedRetailPrice"
                type="number"
                step="0.10"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Estoque Físico Inicial</label>
              <input
                v-model.number="form.stock"
                type="number"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">SKU / Código</label>
              <input
                v-model="form.sku"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Categoria</label>
              <input
                v-model="form.category"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">URL da Imagem</label>
              <input
                v-model="form.imageUrl"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            @click="showModal = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            @click="submitForm"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20"
          >
            {{ isEditing ? 'Salvar Alterações' : 'Cadastrar Produto' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
