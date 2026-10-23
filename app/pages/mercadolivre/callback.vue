<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Store,
  Layers,
  Zap,
  Network,
  RefreshCw,
  Home,
  Check
} from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';
import type { ConnectedAccount } from '~/types/collab';

const route = useRoute();
const router = useRouter();
const store = useCollabStore();

// Read query params forwarded by backend /api/v1/mercadolivre/auth/callback
const status = computed(() => (route.query.status as string) || (route.query.error ? 'error' : 'success'));
const isSuccess = computed(() => status.value === 'success');
const errorMessage = computed(() => (route.query.message as string) || (route.query.error as string) || 'Não foi possível concluir a autorização da conta.');

const accountId = computed(() => (route.query.accountId as string) || `ml_${Date.now()}`);
const storeName = computed(() => (route.query.storeName as string) || 'Loja Mercado Livre Conectada');
const username = computed(() => (route.query.username as string) || 'ml_seller_oficial');
const sellerId = computed(() => (route.query.sellerId as string) || store.currentSeller.id);

// Countdown redirect timer
const countdown = ref(7);
const countdownActive = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

// Synchronize with API / Pinia Store
onMounted(async () => {
  if (isSuccess.value) {
    // Reload accounts and products from External API via BFF
    await store.initStore();

    if (route.query.storeName || route.query.username || route.query.accountId) {
      const connectedAccount: ConnectedAccount = {
        id: accountId.value,
        sellerId: sellerId.value,
        platform: 'mercadolivre',
        storeName: storeName.value,
        username: username.value,
        status: 'connected',
      };
      store.syncOAuthAccount(connectedAccount);
    }

    // Start auto-redirect countdown
    timer = setInterval(() => {
      if (!countdownActive.value) return;
      if (countdown.value > 1) {
        countdown.value--;
      } else {
        if (timer) clearInterval(timer);
        goToIntegrations();
      }
    }, 1000);
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const pauseCountdown = () => {
  countdownActive.value = false;
  if (timer) clearInterval(timer);
};

const goToIntegrations = () => {
  store.activeTab = 'integrations';
  router.push('/');
};

const goToDashboard = () => {
  store.activeTab = 'dashboard';
  router.push('/');
};

const goToAds = () => {
  store.activeTab = 'ads';
  router.push('/');
};

const retryConnection = async () => {
  try {
    const result = await store.fetchMercadoLivreAuthUrl();
    if (result.url) {
      window.location.href = result.url;
    }
  } catch (err: any) {
    alert(err.message || 'Erro ao reiniciar autorização do Mercado Livre.');
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Top App Bar Header -->
    <header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
          C
        </div>
        <div>
          <span class="font-bold text-white tracking-tight text-base">CollabMarket</span>
          <span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
            Nuxt 4 BFF
          </span>
        </div>
      </div>

      <button
        @click="goToIntegrations"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
      >
        <Home class="w-3.5 h-3.5" />
        <span>Ir para o Início</span>
      </button>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-xl">
        <!-- SUCCESS STATE CARD -->
        <div
          v-if="isSuccess"
          class="relative overflow-hidden bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <!-- Background Glow Effect -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Header Icon & Status Badge -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <!-- Mercado Livre Logo representation with success check -->
              <div class="relative">
                <div class="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/20 border border-amber-300">
                  <span class="tracking-tighter">ml</span>
                </div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md border-2 border-slate-900">
                  <Check class="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OAuth 2.0 Concluído
                </span>
                <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Mercado Livre Conectado com Sucesso!
                </h1>
              </div>
            </div>
          </div>

          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sua conta de vendedor do Mercado Livre foi autorizada e integrada com sucesso ao <strong class="text-white">CollabMarket Hub</strong>. A confirmação foi processada pela API e a integração já está ativa.
          </p>

          <!-- Account Details Box -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Store class="w-3.5 h-3.5 text-amber-400" />
              Dados da Conta Autorizada
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-400 block font-medium">Nome da Loja</span>
                <span class="font-bold text-white text-sm mt-0.5 block truncate">{{ storeName }}</span>
              </div>

              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-400 block font-medium">Usuário ML / Nickname</span>
                <span class="font-mono text-amber-300 text-xs mt-1 block truncate">@{{ username }}</span>
              </div>

              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-400 block font-medium">ID da Conexão</span>
                <span class="font-mono text-slate-300 text-[11px] mt-1 block truncate">{{ accountId }}</span>
              </div>

              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-400 block font-medium">Status da Integração</span>
                <span class="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado & Ativo
                </span>
              </div>
            </div>
          </div>

          <!-- Feature checklist -->
          <div class="space-y-2 pt-1 text-xs text-slate-300">
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sincronização em tempo real de pedidos e envios habilitada</span>
            </div>
            <div class="flex items-center gap-2">
              <Zap class="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Publicação automática de anúncios do catálogo colaborativo ativa</span>
            </div>
          </div>

          <!-- Auto-Redirect Countdown Notice -->
          <div
            v-if="countdownActive"
            class="flex items-center justify-between text-xs text-slate-400 bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800/60"
          >
            <div class="flex items-center gap-2">
              <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Redirecionando automaticamente em <strong class="text-white">{{ countdown }}s</strong>...</span>
            </div>
            <button
              @click="pauseCountdown"
              class="text-indigo-400 hover:text-indigo-300 text-xs font-medium underline"
            >
              Pausar
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              @click="goToIntegrations"
              class="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
            >
              <Network class="w-4 h-4" />
              <span>Central de Integrações</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <button
              @click="goToAds"
              class="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Layers class="w-4 h-4 text-indigo-400" />
              <span>Publicar Anúncios</span>
            </button>
          </div>
        </div>

        <!-- ERROR STATE CARD -->
        <div
          v-else
          class="bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle class="w-6 h-6" />
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Erro de Autenticação
              </span>
              <h1 class="text-xl font-bold text-white tracking-tight mt-1">
                Falha ao Conectar Mercado Livre
              </h1>
            </div>
          </div>

          <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 space-y-1">
            <div class="font-bold">Detalhe do Erro:</div>
            <p class="font-mono text-[11px]">{{ errorMessage }}</p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              @click="retryConnection"
              class="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>

            <button
              @click="goToIntegrations"
              class="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors border border-slate-700"
            >
              <span>Voltar ao Hub</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
      CollabMarket © 2026 - Conexão Segura OAuth 2.0 Mercado Livre
    </footer>
  </div>
</template>
