<template lang="pug">
.main-content
  div.mx-auto.mb-10(style="width: 100%; max-width: 800px")
    p.mb-3 Required Network:  
      v-chip(color="blue")
        |Testnet
    p Current Network:  
      v-chip(:color="currentNetwork=='Testnet' ? 'green' : 'red'")
        |{{ currentNetwork }}
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 Add Whitelist (Admin only)
    v-text-field(variant="outlined" label="Aptos Address" v-model="address")
    v-btn.bg-blue-grey-darken-3.text-capitalize(v-if="selectedWallet.address" width="100%"  @click="addToWhitelist" variant="tonal") Add to Whitelist
    v-btn.bg-blue-grey-darken-3.text-capitalize(v-else variant="tonal" disabled width="100%") Wallet Not Connected
  
  hr.my-10
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 Mint NFT
    div.d-flex.flex-column.align-center.mx-auto(style="max-width:500px; width:100%")
      v-img.rounded.elevation-2.mb-4(height="300" width="300" :src="collection.collection_uri" )
      h3 {{ collection.collection_name }}
      p {{ collection.collection_description }}
      v-text-field.mt-10(style="width:100%"  variant="outlined" label="NFT Amount" v-model="nft_amount")
      v-btn.bg-blue-grey-darken-3(v-if="selectedWallet.address"  width="100%"  @click="mintNft" variant="tonal")
        div.d-flex.flex-row.justify-center.align-center.flex-grow-1(style="gap:12px")
          v-img.flex-grow-0(width="26" height="26" :src="selectedWallet.logo" )
          p.text-capitalize Mint {{ nft_amount > 0 ? nft_amount : 0 }} NFT(<span class="text-lowercase">s</span>) with {{ selectedWallet.name }}
      v-btn.bg-blue-grey-darken-3.text-capitalize(v-else variant="tonal" disabled width="100%") Wallet Not Connected
      
  hr.my-10
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 My NFT
    //- div.d-flex.flex-row.flex-wrap(style="gap:20px" v-if="selectedWallet.address")
    v-row(v-if="selectedWallet.address")
      v-col.pa-2(cols="6" md="3"  v-for="(nft, index) in minted_nft" :key="index" )
        v-card.align-self-start.elevation-2.rounded-lg(max-width="250" width="100%")
          v-img( :src="nft.metadata_uri" height="auto" width="100%" cover aspect-ratio="1")
          v-card-title.pb-0.px-2 {{ nft.name }}
          v-card-subtitle.px-2 {{ nft.collection_name }}
          v-card-actions
            v-btn.bg-blue-grey-darken-3.text-capitalize.ml-auto(
              :append-icon="show[index] ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="tonal"
              @click="show[index] ?  show[index] = false : show[index] = true"
              height="25"
            ) More
          v-expand-transition
            div(v-show="show[index]")
              v-divider
              v-card-text.px-2
                p.mb-3 Creator: 
                  a.text-decoration-none(:href="`https://explorer.aptoslabs.com/account/${nft.creator_address}`" target="_blank")
                    strong {{ nft.creator_address }}
                p.mb-3 Royalty: 
                  strong {{ (nft.royalty_points_numerator/nft.royalty_points_denominator) * 100 }}%
                p.mb-2 Property:
                div(v-for="(item, index) in propertyDetails(nft.default_properties)" :key="index" v-html="item")

    div(v-else)
      p Please Connect Wallet
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';

const contractAddress = '0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f'
const selectedWallet = ref({})
const collection = ref({})
const address = ref('')
const nft_amount = ref(1)
const minted_nft = ref([])
const show =  ref([])
const currentNetwork = ref('')

const props = defineProps(['hasWallet'])

watch(
  () => props.hasWallet,
  async (hasWallet) => {
    if (hasWallet) {
      await getWallet()
    }else{
      minted_nft.value = []
      selectedWallet.value = {}
      currentNetwork.value = await getNetwork()
    }
  }
)

onMounted(async () => {
  await getCollection()
  await getWallet()
})

async function getWallet(){
  if (localStorage.getItem("SelectedWallet")) {
    selectedWallet.value = JSON.parse(localStorage.getItem("SelectedWallet"))
    if (selectedWallet.value) {
      await getMintedNFT()
    }
  }
  currentNetwork.value = await getNetwork()
}

async function getNetwork() {
  if (selectedWallet.value) {
    if (selectedWallet.value.name === 'Martian')
      return window.martian.network()

    if (selectedWallet.value.name === 'Pontem')
      return window.pontem.network()

    if (selectedWallet.value.name === 'Petra')
      return window.petra.network()

    if (selectedWallet.value.name === 'Rise')
      return window.rise.network()
  }

  return 'Not Connected'
}

function propertyDetails(obj) {
  const entries = Object.entries(obj)
  let data = entries.map(([key, val] = entry) => {
    return `<div class="py-2 px-3 mb-1 bg-blue-grey-darken-3 rounded-lg"><p class="mb-0">${key}: <strong>${val}</strong></p><div>`;
  });
  return data
}

// Get Collection
async function getCollection() {
  await axios.get(`https://fullnode.testnet.aptoslabs.com/v1/accounts/${contractAddress}/resource/${contractAddress}::minting::CollectionConfig`)
    .then(response => (
      collection.value = response.data.data
    ))
}

// Get Minted NFT
async function getMintedNFT() {
  var OwnedToken = []
  await axios.post(`https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql`, {
    "operationName": "AccountTokensData",
    "variables": {
      "owner_address": selectedWallet.value.address,
      "limit": 20,
      "offset": 0
    },
    "query": "query AccountTokensData($owner_address: String, $limit: Int, $offset: Int) {\n  current_token_ownerships(\n    where: {owner_address: {_eq: $owner_address}, amount: {_gt: \"0\"}}\n    limit: $limit\n    offset: $offset\n  ) {\n    token_data_id_hash\n    name\n    collection_name\n    table_type\n    property_version\n    amount\n    __typename\n  }\n}"
  })
  .then(response => (
    OwnedToken = response.data.data.current_token_ownerships
  ))

  minted_nft.value = []

  OwnedToken.forEach(async token => {
    let tokenMetadata = {}
    await axios.post(`https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql`, {
      "operationName": "TokenData",
      "variables": {
        "token_id": token.token_data_id_hash
      },
      "query": "query TokenData($token_id: String) {\n  current_token_datas(where: {token_data_id_hash: {_eq: $token_id}}) {\n    token_data_id_hash\n    name\n    collection_name\n    creator_address\n    default_properties\n    largest_property_version\n    maximum\n    metadata_uri\n    payee_address\n    royalty_points_denominator\n    royalty_points_numerator\n    supply\n    __typename\n  }\n}"
    })
    .then(response => (
      tokenMetadata = response.data.data.current_token_datas[0]
    ))

    if (tokenMetadata.creator_address === contractAddress) {
      minted_nft.value.push(tokenMetadata)
    }
  });
  
}

// Generate a transaction
async function addToWhitelist(){
  const sender = selectedWallet.value.address
  const expiry_time = Math.round(new Date() / 1000) + 180
  var txn
  var payload = {
    type: "entry_function_payload",
    function: `${contractAddress}::minting::add_to_whitelist `,
    type_arguments: [],
    arguments: [[address.value], 100]
  };

  if (selectedWallet.value.name === 'Martian') {
    await window.martian.generateSignAndSubmitTransaction(sender, payload, { expiration_timestamp_secs: expiry_time })
      .then(txn => {
        console.log('Txn', txn)
      })
      .catch(e => {
        alert(e.message)
        return
      })
  }

  if (selectedWallet.value.name === 'Pontem') {
    await window.pontem.signAndSubmit(payload, { expiration_timestamp_secs: expiry_time })
      .then(txn => {
        console.log('Txn', txn)
      })
      .catch(e => {
        alert(e.message)
        return
      })
  }

  if (selectedWallet.value.name === 'Petra') {
    await window.petra.signAndSubmitTransaction(payload, { expiration_timestamp_secs: expiry_time })
      .then(txn => {
        console.log('Txn', txn)
      })
      .catch(e => {
        alert(e.message)
        return
      })
  }

  if (selectedWallet.value.name === 'Rise') {
    await window.rise.signAndSubmitTransaction(payload, { expiration_timestamp_secs: expiry_time })
      .then(txn => {
        console.log('Txn', txn)
      })
      .catch(e => {
        alert(e.message)
        return
      })
  }

  address.value = ''
}

async function mintNft() {
  const sender = selectedWallet.value.address
  const expiry_time = Math.round(new Date() / 1000) + 600
  var transaction
  var txn
  var payload = {
    type: "entry_function_payload",
    function: `${contractAddress}::minting::mint_nft`,
    type_arguments: [],
    arguments: [nft_amount.value]
  };
  if (parseInt(nft_amount.value)){
    if (selectedWallet.value.name === 'Martian') {
      await window.martian.generateSignAndSubmitTransaction(sender, payload, { expiration_timestamp_secs: expiry_time })
        .then(txn => {
          console.log('Txn', txn)
        })
        .catch(e => {
          alert(e.message)
          return
        })
    }

    if (selectedWallet.value.name === 'Pontem') {
      await window.pontem.signAndSubmit(payload, { expiration_timestamp_secs: expiry_time })
        .then(txn => {
          console.log('Txn', txn)
        })
        .catch(e => {
          alert(e.message)
          return
        })
    }

    if (selectedWallet.value.name === 'Petra') {
      await window.petra.signAndSubmitTransaction(payload, { expiration_timestamp_secs: expiry_time })
        .then(txn => {
          console.log('Txn', txn)
        })
        .catch(e => {
          alert(e.message)
          return
        })
    }

    if (selectedWallet.value.name === 'Rise') {
      await window.rise.signAndSubmitTransaction(payload, { expiration_timestamp_secs: expiry_time })
        .then(txn => {
          console.log('Txn', txn)
        })
        .catch(e => {
          alert(e.message)
          return
        })
    }
    setTimeout(async () => {
      await getMintedNFT()
    }, 2000);
  }else{
    alert("NFT Amount must be at least 1")
  }

}
</script>

<style lang="scss" scoped>
.main-content{
  padding: 50px 60px;
  padding-top: 100px;
}

@media (max-width: 450px){
  .main-content{
    padding: 40px 30px;
    padding-top: 80px;
    width: 100%;
    max-width: 1028px;
    margin: 0 auto;
  }
}
</style>
