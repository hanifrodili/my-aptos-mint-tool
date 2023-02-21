<template lang="pug">
.ConnectWallet
  v-btn.connect-wallet-btn.elevation-0( @click="toggleSelectWallet()" )
    div.d-flex.flex-row.justify-space-between.align-center.flex-grow-1(style="width:130px")
      v-img.flex-grow-0.mr-2.rounded-circle(width="26" height="26" :src="selectedWallet.logo" style="border:1px solid white" v-if="walletAddress" )
      svg(v-else width='22' height='22' viewbox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg')
        path(d='M3.4375 5.5V16.5C3.4375 16.8647 3.58237 17.2144 3.84023 17.4723C4.09809 17.7302 4.44783 17.875 4.8125 17.875H18.5625C18.7448 17.875 18.9197 17.8026 19.0486 17.6736C19.1776 17.5447 19.25 17.3698 19.25 17.1875V7.5625C19.25 7.38017 19.1776 7.20529 19.0486 7.07636C18.9197 6.94743 18.7448 6.875 18.5625 6.875H4.8125C4.44783 6.875 4.09809 6.73013 3.84023 6.47227C3.58237 6.21441 3.4375 5.86467 3.4375 5.5ZM3.4375 5.5C3.4375 5.13533 3.58237 4.78559 3.84023 4.52773C4.09809 4.26987 4.44783 4.125 4.8125 4.125H16.5' stroke='white' stroke-width='1.375' stroke-linecap='round' stroke-linejoin='round')
        path(d='M15.4688 13.4063C16.0383 13.4063 16.5 12.9445 16.5 12.375C16.5 11.8055 16.0383 11.3438 15.4688 11.3438C14.8992 11.3438 14.4375 11.8055 14.4375 12.375C14.4375 12.9445 14.8992 13.4063 15.4688 13.4063Z' fill='white')
        
      p(v-if="!walletAddress") Connect Wallet
      p.d-inline-block.text-truncate(v-else) {{ walletAddress }}
  v-dialog(
    v-model="openSelectWallet"
    persistent
    transition="dialog-bottom-transition"
    max-width="300"
    )
    v-card.bg-blue-grey-darken-4(style="border-radius: 8px")
      v-card-title.text-center
        p(v-if="!walletAddress") Select Wallet
        div.d-flex.flex-row.align-center(v-else)
          v-img.flex-grow-0.mr-4(height="40" width="40" :src="selectedWallet.logo" )
          p {{ selectedWallet.name }} Wallet
      v-card-text.d-flex.flex-column(v-if="!walletAddress" style="gap: 12px")
        v-btn.bg-blue-grey-darken-3(v-for="(wallet, index) in walletList" :key="index" variant="tonal" height="50" @click="connectAptosWallet(wallet)" )
          div.d-flex.flex-row.justify-space-between.align-center.flex-grow-1(style="width:200px")
            p.text-capitalize {{ wallet.name }}
            v-img.flex-grow-0(width="26" height="26" :src="wallet.logo" )
      v-card-text.d-flex.flex-column(v-else style="gap: 12px")
        code.code-card {{ walletAddress }}
        v-btn.bg-blue-grey-darken-3.text-capitalize( @click="disconnectAptosWallet" variant="tonal") Disconnect
          
      v-card-actions.justify-end
        v-btn( @click="openSelectWallet = false" variant="plain" )
          p.text-capitalize Close   
</template>

<script setup>
import { onMounted, ref } from 'vue';
import MartianLogo from '/src/assets/images/logo_martian_wallet.svg'
import PontemLogo from '/src/assets/images/logo_pontem_wallet.svg'
import PetraLogo from '/src/assets/images/logo_petra_wallet.svg'
import RiseLogo from '/src/assets/images/logo_rise_wallet.svg'

const emit = defineEmits(['walletAddress', 'selectedWallet'])

const openSelectWallet = ref(false)
const walletAddress = ref('')
const selectedWallet = ref({})
const walletList = ref([
  {
    name: 'Martian',
    logo: MartianLogo,
    link: 'https://www.martianwallet.xyz/'
  },
  {
    name: 'Pontem',
    logo: PontemLogo,
    link: 'https://pontem.network/'
  },
  {
    name: 'Petra',
    logo: PetraLogo,
    link: 'https://petra.app/'
  },
  {
    name: 'Rise',
    logo: RiseLogo,
    link: 'https://risewallet.io/'
  }
])

onMounted(() => {
  if (localStorage.getItem("AptosWalletAddress")){
    walletAddress.value = localStorage.getItem("AptosWalletAddress")
    emit('walletAddress', walletAddress.value)
  }

  if (localStorage.getItem("SelectedWallet")) {
    selectedWallet.value = JSON.parse(localStorage.getItem("SelectedWallet"))
    emit('selectedWallet', selectedWallet.value)
  }

  if (walletAddress.value && selectedWallet.value) {
    connectAptosWallet(selectedWallet.value)
  }
})

function toggleSelectWallet(){
  openSelectWallet.value = !openSelectWallet.value
}

async function connectAptosWallet(wallet) {
  let provider = null
  selectedWallet.value = wallet
  localStorage.setItem("SelectedWallet", JSON.stringify(wallet));

  if(wallet.name.toLowerCase() in window){
    if (wallet.name === 'Martian')
      provider = window.martian
    
    if (wallet.name === 'Pontem')
      provider = window.pontem

    if (wallet.name === 'Petra')
      provider = window.petra
    
    if (wallet.name === 'Rise')
      provider = window.rise
  }else {
    alert('Wallet not installed', 'error')
    window.open(wallet.link, '_blank');
    window.location.reload()
    return
  }


  if (!await provider.isConnected()) {
    const account = await provider.connect()
    walletAddress.value = account.address
    localStorage.setItem("AptosWalletAddress", account.address);
    openSelectWallet.value = false
    emit('walletAddress', walletAddress.value)
    emit('selectedWallet', selectedWallet.value)
  }
}

async function disconnectAptosWallet() {
  if (selectedWallet.value.name === 'Martian')
    await window.martian.disconnect()

  if (selectedWallet.value.name === 'Pontem')
    await window.pontem.disconnect()

  if (selectedWallet.value.name === 'Petra')
    await window.petra.disconnect()

  if (selectedWallet.value.name === 'Rise')
    await window.rise.disconnect()

  localStorage.removeItem("AptosWalletAddress");
  localStorage.removeItem("SelectedWallet");
  openSelectWallet.value = false
  window.location.reload()
}

</script>

<style lang="scss" scoped>
.connect-wallet-btn{
  height: 48px !important;
  width: 175px;
  border-radius: 48px;
  background-color: #1b1c20;

  p{
    color: #fff;
    font-size: 14px;
    letter-spacing: 0;
    text-transform: capitalize;
  }
}
.connect-wallet-btn:hover{
  background-color: transparent;
  // border: 1px solid #000;
  svg{
    path {
      fill: transparent;
      stroke: #000;
    }
  }
  p{
    color: #000;
  }
}

.code-card{
    padding: 10px;
    background-color: darkgray;
    border-radius: 4px;
    color: black;
    letter-spacing: 0;
}
</style>
