<script setup lang="ts">
import { Printer, X, CheckCircle, Package, Truck } from 'lucide-vue-next';
import type { Order, Product, Seller } from '~/types/collab';

const props = defineProps<{
  order: Order | null;
  product: Product | null;
  owner: Seller | null;
  advertiser: Seller | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handlePrint = () => {
  window.print();
};
</script>

<template>
  <div v-if="order" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
      <!-- Header Modal -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">Etiqueta de Envio Oficial & PLP</h3>
            <p class="text-xs text-slate-400">Pronta para impressão térmica ou A4 padrão</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Shipping Label Printable Area -->
      <div class="p-6">
        <div class="bg-white text-slate-950 p-6 rounded-xl border-2 border-dashed border-slate-400 shadow-inner font-mono text-sm space-y-6 print:border-solid print:p-0">
          <!-- Top Barcode Mock -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-1 rounded">
                {{ order.platform.toUpperCase() }} ENVIOS
              </span>
              <div class="text-xs text-slate-600 mt-1 font-sans">Contrato Correios / Transportadora Express</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500 font-sans">PLP Lote</div>
              <div class="font-bold text-slate-900">{{ order.shippingLabelId }}</div>
            </div>
          </div>

          <!-- Barcode Graphic Simulation -->
          <div class="flex flex-col items-center justify-center py-2 bg-slate-50 rounded border border-slate-200">
            <div class="font-bold text-base tracking-widest">{{ order.trackingNumber }}</div>
            <div class="flex gap-1 h-12 items-center my-1">
              <div v-for="i in 36" :key="i" class="bg-black h-full" :style="{ width: (i % 3 === 0 ? '3px' : (i % 2 === 0 ? '1px' : '2px')) }"></div>
            </div>
            <div class="text-[10px] text-slate-500">Postagem pré-paga pelo Marketplace</div>
          </div>

          <!-- Recipient / Destinatário -->
          <div class="border-b border-slate-300 pb-4">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Destinatário</div>
            <div class="font-bold text-base text-slate-900">{{ order.buyerName }}</div>
            <div class="text-xs text-slate-700 leading-relaxed font-sans mt-1">
              {{ order.buyerAddress }}
            </div>
          </div>

          <!-- Remetente (Cross-docking / Fornecedor) -->
          <div class="grid grid-cols-2 gap-4 text-xs font-sans text-slate-700 border-b border-slate-300 pb-4">
            <div>
              <div class="font-bold text-slate-500 uppercase tracking-wider mb-1">Remetente (Expedição)</div>
              <div class="font-bold text-slate-900">{{ owner?.storeName || 'Fornecedor Físico' }}</div>
              <div>Resp: {{ owner?.name }}</div>
              <div class="text-[11px] text-slate-500">Estoque & Logística Colaborativa</div>
            </div>
            <div>
              <div class="font-bold text-slate-500 uppercase tracking-wider mb-1">Vendedor / Anunciante</div>
              <div class="font-bold text-slate-900">{{ advertiser?.storeName || 'Loja Anunciante' }}</div>
              <div>Vendedor: {{ advertiser?.name }}</div>
              <div class="text-[11px] text-slate-500">Canal de Atendimento</div>
            </div>
          </div>

          <!-- Item Details -->
          <div class="flex items-center justify-between text-xs font-sans">
            <div>
              <span class="font-bold">Item:</span> {{ product?.title || 'Produto' }} (Qtd: {{ order.quantity }})
              <div class="text-[11px] text-slate-500">SKU: {{ product?.sku }}</div>
            </div>
            <div class="text-right font-bold text-slate-900">
              Pedido: {{ order.id }}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer Controls -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
        <div class="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle class="w-4 h-4" />
          <span>Etiqueta válida emitida pelo ecossistema Nuxt Server BFF</span>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="emit('close')"
            class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            @click="handlePrint"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Printer class="w-4 h-4" />
            Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
