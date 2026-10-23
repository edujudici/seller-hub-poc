<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Network,
  Plus,
  ShieldCheck,
  Unlink,
  RefreshCw,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  ArrowRight,
  Lock,
  Store,
  Info,
} from "lucide-vue-next";
import { useCollabStore } from "~/stores/collab";
import type { MarketplacePlatform } from "~/types/collab";

const store = useCollabStore();
const route = useRoute();
const router = useRouter();

const showConnectModal = ref(false);
const formPlatform = ref<MarketplacePlatform>("mercadolivre");
const formStoreName = ref("");
const formUsername = ref("");
const formError = ref<string | null>(null);

// Mercado Livre OAuth State
const isConnectingML = ref(false);
const redirectingUrl = ref<string | null>(null);
const mlErrorMessage = ref<string | null>(null);
const mlSuccessNotice = ref<string | null>(null);
const showBffInspector = ref(false);

const mlAccounts = computed(() =>
  store.myAccounts.filter((a) => a.platform === "mercadolivre"),
);
const otherAccounts = computed(() =>
  store.myAccounts.filter((a) => a.platform !== "mercadolivre"),
);

/**
 * Real Mercado Livre OAuth Flow:
 * 1. Requests {EXTERNAL_API_BASE_URL}/api/v1/mercadolivre/auth/url via Nuxt Server BFF
 * 2. Receives authorization URL (https://auth.mercadolivre.com.br/authorization?...)
 * 3. Redirects the user to the authorization URL
 */
const handleConnectMercadoLivre = async () => {
  isConnectingML.value = true;
  mlErrorMessage.value = null;
  redirectingUrl.value = null;

  try {
    console.log(
      "[Mercado Livre OAuth] Solicitando URL de autorização dinâmica via Nuxt BFF (/api/v1/mercadolivre/auth/url)...",
    );
    const result = await store.fetchMercadoLivreAuthUrl(store.currentSeller.id);

    if (!result || !result.url) {
      throw new Error(
        "Nenhuma URL de autorização válida foi retornada pelo servidor.",
      );
    }

    redirectingUrl.value = result.url;
    console.log(
      "[Mercado Livre OAuth] URL de autorização dinâmica obtida:",
      result.url,
    );
    console.log(
      "[Mercado Livre OAuth] Redirecionando usuário para o Mercado Livre...",
    );

    // Small delay to let user see the status transition before navigating
    setTimeout(() => {
      try {
        window.location.href = result.url;
      } catch (err) {
        console.warn(
          "[Mercado Livre OAuth] window.location.href bloqueado, tentando fallback open:",
          err,
        );
        window.open(result.url, "_top");
      }
    }, 600);
  } catch (err: any) {
    console.error(
      "[Mercado Livre OAuth Err] Falha ao iniciar autorização:",
      err,
    );
    mlErrorMessage.value =
      err.message || "Erro ao comunicar com a API do Mercado Livre.";
    isConnectingML.value = false;
  }
};

// Check for return notices or legacy query codes
onMounted(() => {
  if (route.query.status === "success") {
    mlSuccessNotice.value =
      "Conta do Mercado Livre autorizada e vinculada com sucesso!";
    router.replace({ query: {} });
  }
  if (route.query.status === "error") {
    mlErrorMessage.value =
      "Erro ao autorizar conta do Mercado Livre. Tente novamente mais tarde.";
    router.replace({ query: {} });
  }
});

const openConnect = (platform?: MarketplacePlatform) => {
  if (platform) formPlatform.value = platform;
  formStoreName.value = "";
  formUsername.value = "";
  formError.value = null;
  showConnectModal.value = true;
};

const submitConnect = async () => {
  if (!formStoreName.value || !formUsername.value) {
    formError.value = "Por favor preencha todos os campos da conta.";
    return;
  }

  try {
    await store.connectAccount({
      sellerId: store.currentSeller.id,
      platform: formPlatform.value,
      storeName: formStoreName.value,
      username: formUsername.value,
      status: "connected",
    });
    showConnectModal.value = false;
  } catch (err: any) {
    formError.value = err.message || "Erro ao conectar conta de marketplace.";
  }
};

const handleDisconnect = async (id: string) => {
  if (
    confirm(
      "Deseja realmente desconectar esta conta? Anúncios vinculados não serão mais sincronizados.",
    )
  ) {
    await store.disconnectAccount(id);
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h2
          class="text-2xl font-bold text-white tracking-tight flex items-center gap-2"
        >
          <Network class="w-6 h-6 text-indigo-400" />
          Marketplace Integrations & OAuth Hub
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Gerencie integrações em tempo real com Mercado Livre, Shopee, Amazon e
          Magalu via Nuxt 4 Server BFF.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="showBffInspector = !showBffInspector"
          class="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700/60 transition-all"
        >
          <Info class="w-3.5 h-3.5 text-indigo-400" />
          {{ showBffInspector ? "Ocultar Detalhes BFF" : "Fluxo Nuxt BFF" }}
        </button>

        <button
          @click="openConnect()"
          class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <Plus class="w-4 h-4" />
          Vincular Manualmente
        </button>
      </div>
    </div>

    <!-- OAuth Callback Success Banner -->
    <div
      v-if="mlSuccessNotice"
      class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center justify-between"
    >
      <div class="flex items-center gap-2.5">
        <CheckCircle class="w-5 h-5 flex-shrink-0" />
        <div>
          <span class="font-bold">OAuth Finalizado:</span> {{ mlSuccessNotice }}
        </div>
      </div>
      <button
        @click="mlSuccessNotice = null"
        class="text-slate-400 hover:text-white text-xs"
      >
        ✕
      </button>
    </div>

    <!-- OAuth Error Alert -->
    <div
      v-if="mlErrorMessage"
      class="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center justify-between"
    >
      <div class="flex items-center gap-2.5">
        <AlertCircle class="w-5 h-5 flex-shrink-0" />
        <div>
          <span class="font-bold">Erro no fluxo OAuth:</span>
          {{ mlErrorMessage }}
        </div>
      </div>
      <button
        @click="mlErrorMessage = null"
        class="text-slate-400 hover:text-white text-xs"
      >
        ✕
      </button>
    </div>

    <!-- Architecture & BFF Flow Details (Collapsible Inspector) -->
    <div
      v-if="showBffInspector"
      class="p-5 bg-slate-900 border border-indigo-500/30 rounded-2xl space-y-3"
    >
      <div
        class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider"
      >
        <Zap class="w-4 h-4" />
        Arquitetura: Frontend ➔ BFF ➔ API Externa ➔ Mercado Livre
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300"
      >
        <div
          class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
        >
          <div class="text-[11px] font-semibold text-amber-400">
            1. Frontend ➔ BFF
          </div>
          <p class="text-slate-400 text-[11px]">
            Frontend solicita ao BFF a URL de autorização do Mercado Livre:
          </p>
          <div
            class="font-mono text-[10px] text-indigo-300 bg-slate-900 p-1.5 rounded border border-slate-800 break-all"
          >
            GET /api/v1/mercadolivre/auth/url
          </div>
        </div>

        <div
          class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
        >
          <div class="text-[11px] font-semibold text-indigo-400">
            2. BFF ➔ API Externa
          </div>
          <p class="text-slate-400 text-[11px]">
            O BFF consulta a API externa, que devolve a URL oficial do Mercado
            Livre:
          </p>
          <div
            class="font-mono text-[10px] text-amber-300 bg-slate-900 p-1.5 rounded border border-slate-800 break-all"
          >
            GET /api/v1/mercadolivre/auth/url
          </div>
        </div>

        <div
          class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
        >
          <div class="text-[11px] font-semibold text-sky-400">
            3. Mercado Livre
          </div>
          <p class="text-slate-400 text-[11px]">
            O browser redireciona para a tela do Mercado Livre para o cliente
            autorizar a conta.
          </p>
        </div>

        <div
          class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
        >
          <div class="text-[11px] font-semibold text-emerald-400">
            4. API ➔ Frontend
          </div>
          <p class="text-slate-400 text-[11px]">
            ML redireciona para a API, e a API redireciona para o frontend
            exibir sucesso:
          </p>
          <div
            class="font-mono text-[10px] text-emerald-300 bg-slate-900 p-1.5 rounded border border-slate-800 break-all"
          >
            /mercadolivre/callback
          </div>
        </div>
      </div>
    </div>

    <!-- FEATURED INTEGRATION: MERCADO LIVRE (REAL OAUTH FLOW) -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl"
    >
      <!-- Background Glow Accent -->
      <div
        class="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div
        class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div class="space-y-4 max-w-2xl">
          <div class="flex items-center gap-3">
            <!-- Mercado Livre Badge / Logo representation -->
            <div
              class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/20 border border-amber-300"
            >
              <span class="tracking-tighter">ml</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-white tracking-tight">
                  Mercado Livre
                </h3>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40"
                >
                  Integração Real OAuth 2.0
                </span>
                <span
                  v-if="mlAccounts.length > 0"
                  class="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                >
                  <CheckCircle class="w-3 h-3" />
                  {{ mlAccounts.length }}
                  {{
                    mlAccounts.length === 1
                      ? "Conta Conectada"
                      : "Contas Conectadas"
                  }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Conecte sua conta de vendedor do Mercado Livre para publicação
                instantânea de anúncios do catálogo colaborativo, cálculo de
                frete Mercado Envios e sincronização automática de vendas.
              </p>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1"
          >
            <span
              class="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
            >
              <ShieldCheck class="w-3.5 h-3.5 text-amber-400" />
              OAuth Oficial Autorizado
            </span>
            <span
              class="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
            >
              <Zap class="w-3.5 h-3.5 text-indigo-400" />
              Comunicação: BFF ➔ API
            </span>
            <span class="text-slate-500">
              Endpoint:
              <code class="font-mono text-amber-400/90 text-[10px]"
                >/api/v1/mercadolivre/auth/url</code
              >
            </span>
          </div>
        </div>

        <!-- Call to Action Buttons -->
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <button
            @click="handleConnectMercadoLivre"
            :disabled="isConnectingML"
            class="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl"
            :class="
              isConnectingML
                ? 'bg-amber-500/70 text-slate-950 cursor-wait'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98]'
            "
          >
            <RefreshCw
              v-if="isConnectingML"
              class="w-4 h-4 animate-spin text-slate-950"
            />
            <Zap v-else class="w-4 h-4 text-slate-950 fill-current" />
            <span>{{
              isConnectingML
                ? "Obtendo URL OAuth..."
                : mlAccounts.length > 0
                  ? "Reconectar / Adicionar Loja ML"
                  : "Conectar com Mercado Livre"
            }}</span>
            <ArrowRight v-if="!isConnectingML" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Active Redirect State Indicator -->
      <div
        v-if="redirectingUrl"
        class="mt-5 pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-2 text-amber-300">
          <RefreshCw class="w-4 h-4 animate-spin flex-shrink-0" />
          <span>
            URL de autorização recebida com sucesso! Redirecionando para o
            Mercado Livre...
          </span>
        </div>
        <a
          :href="redirectingUrl"
          target="_top"
          class="flex items-center gap-1.5 text-xs text-white underline hover:text-amber-300 transition-colors font-medium"
        >
          <span>Clique aqui se não for redirecionado automaticamente</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </div>

    <!-- Active Connected Accounts Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Store class="w-4 h-4 text-indigo-400" />
          Contas Conectadas do Vendedor ({{ store.currentSeller.name }})
        </h3>
        <span class="text-xs text-slate-400">
          Total:
          <span class="font-bold text-white">{{
            store.myAccounts.length
          }}</span>
        </span>
      </div>

      <!-- Accounts Grid -->
      <div
        v-if="store.myAccounts.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          v-for="acc in store.myAccounts"
          :key="acc.id"
          class="bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all"
          :class="
            acc.platform === 'mercadolivre'
              ? 'border-amber-500/40 hover:border-amber-400/60 shadow-lg shadow-amber-500/5'
              : 'border-slate-800 hover:border-slate-700'
          "
        >
          <div class="flex items-center justify-between">
            <span
              class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
              :class="
                acc.platform === 'mercadolivre'
                  ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              "
            >
              {{
                acc.platform === "mercadolivre" ? "Mercado Livre" : acc.platform
              }}
            </span>
            <span
              class="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20"
            >
              <CheckCircle class="w-3 h-3" />
              Ativo
            </span>
          </div>

          <div>
            <h4 class="text-base font-bold text-white leading-snug">
              {{ acc.storeName }}
            </h4>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Usuário:</span>
              <span
                class="font-mono text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded text-[11px] border border-slate-800"
              >
                {{ acc.username }}
              </span>
            </div>
          </div>

          <div
            class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400"
          >
            <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
              <span>Token OAuth Ativo</span>
            </div>
            <button
              @click="handleDisconnect(acc.id)"
              class="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Unlink class="w-3.5 h-3.5" />
              Desconectar
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="py-14 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800"
      >
        <Network class="w-10 h-10 text-slate-600 mx-auto" />
        <div class="space-y-1">
          <div class="text-slate-300 font-semibold text-sm">
            Nenhuma conta de marketplace conectada
          </div>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Clique no botão acima para conectar com o Mercado Livre via OAuth
            oficial ou vincule manualmente outros canais de venda.
          </p>
        </div>
        <button
          @click="handleConnectMercadoLivre"
          class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-400/10 inline-flex items-center gap-2"
        >
          <Zap class="w-3.5 h-3.5 fill-current" />
          Conectar com Mercado Livre
        </button>
      </div>
    </div>

    <!-- Other Marketplaces Catalog -->
    <div class="space-y-4 pt-4 border-t border-slate-800/60">
      <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">
        Outros Canais Disponíveis
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Shopee -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20"
              >
                Shopee
              </span>
              <span class="text-[11px] text-slate-500">API Partner</span>
            </div>
            <h4 class="text-sm font-bold text-white">Shopee Brasil</h4>
            <p class="text-[11px] text-slate-400 mt-1">
              Sincronize pedidos e estoque da sua loja oficial Shopee com o
              catálogo compartilhado.
            </p>
          </div>
          <button
            @click="openConnect('shopee')"
            class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            Vincular Shopee
          </button>
        </div>

        <!-- Amazon -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20"
              >
                Amazon
              </span>
              <span class="text-[11px] text-slate-500">SP-API</span>
            </div>
            <h4 class="text-sm font-bold text-white">Amazon Marketplace</h4>
            <p class="text-[11px] text-slate-400 mt-1">
              Conexão com a Amazon Selling Partner API para gestão unificada de
              pedidos FBM.
            </p>
          </div>
          <button
            @click="openConnect('amazon')"
            class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            Vincular Amazon
          </button>
        </div>

        <!-- Magalu -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20"
              >
                Magalu
              </span>
              <span class="text-[11px] text-slate-500">IntegraCommerce</span>
            </div>
            <h4 class="text-sm font-bold text-white">Magazine Luiza</h4>
            <p class="text-[11px] text-slate-400 mt-1">
              Integração de catálogo e faturamento para vendas na plataforma
              Magalu Marketplace.
            </p>
          </div>
          <button
            @click="openConnect('magalu')"
            class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            Vincular Magalu
          </button>
        </div>
      </div>
    </div>

    <!-- Manual Connect Account Modal -->
    <div
      v-if="showConnectModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div
          class="flex items-center justify-between border-b border-slate-800 pb-4"
        >
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Plus class="w-4 h-4 text-indigo-400" />
            Vincular Conta de Marketplace
          </h3>
          <button
            @click="showConnectModal = false"
            class="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div
          v-if="formError"
          class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ formError }}</span>
        </div>

        <!-- Special OAuth banner inside modal for Mercado Livre -->
        <div
          v-if="formPlatform === 'mercadolivre'"
          class="p-3.5 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs space-y-2 text-slate-300"
        >
          <div class="font-bold text-amber-300 flex items-center gap-1.5">
            <Zap class="w-4 h-4 text-amber-400 fill-current" />
            Conexão Real OAuth Recomendada
          </div>
          <p class="text-[11px] text-slate-400">
            Deseja conectar diretamente através do OAuth oficial do Mercado
            Livre chamando a URL configurada no BFF?
          </p>
          <button
            @click="
              () => {
                showConnectModal = false;
                handleConnectMercadoLivre();
              }
            "
            class="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wide transition-all shadow-md"
          >
            ⚡ Iniciar Conexão OAuth Mercado Livre
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-medium mb-1"
              >Plataforma</label
            >
            <select
              v-model="formPlatform"
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
            <label class="block text-slate-300 font-medium mb-1"
              >Nome de Exibição da Loja</label
            >
            <input
              v-model="formStoreName"
              type="text"
              placeholder="Ex: Minha Loja Oficial"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1"
              >Username / ID da Conta</label
            >
            <input
              v-model="formUsername"
              type="text"
              placeholder="Ex: minhastoreshop_br"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800"
        >
          <button
            @click="showConnectModal = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            @click="submitConnect"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20"
          >
            Salvar Manualmente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
