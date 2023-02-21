<template lang="pug">
Navbar(@walletAddress="updateAddress($event)" @selectedWallet="updateWallet($event)")
.main-content
  div.mx-auto.mb-10(style="width: 100%; max-width: 800px")
    p Required Network: Testnet
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 Add Whitelist (Admin only)
    v-text-field(variant="outlined" label="Aptos Address" v-model="address")
    v-btn.bg-blue-grey-darken-3.text-capitalize(v-if="walletAddress" width="100%"  @click="addToWhitelist" variant="tonal") Add to Whitelist
    v-btn.bg-blue-grey-darken-3(v-else variant="tonal" disabled width="100%") Wallet Not Connected
  
  hr.my-10
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 Mint NFT
    div.d-flex.flex-column.align-center.mx-auto(style="max-width:500px; width:100%")
      v-img(height="300" width="300" :src="collection.collection_uri" )
      h3 {{ collection.collection_name }}
      p {{ collection.collection_description }}
      v-text-field.mt-10(style="width:100%"  variant="outlined" label="NFT Amount" v-model="nft_amount")
      v-btn.bg-blue-grey-darken-3(v-if="walletAddress"  width="100%"  @click="mintNft" variant="tonal")
        div.d-flex.flex-row.justify-center.align-center.flex-grow-1(style="gap:12px")
          v-img.flex-grow-0(width="26" height="26" :src="selectedWallet.logo" )
          p.text-capitalize Mint with {{ selectedWallet.name }}
      v-btn.bg-blue-grey-darken-3(v-else variant="tonal" disabled width="100%") Wallet Not Connected
      
  hr.my-10
  div.mx-auto(style="width: 100%; max-width: 800px")
    h2.mb-2 My NFT
    div.d-flex.flex-row.flex-wrap(style="gap:20px" v-if="walletAddress")
      v-card.align-self-start(max-width="250" width="100%"  v-for="(nft, index) in minted_nft" :key="index")
        v-img( :src="nft.metadata_uri" height="200" cover)
        v-card-title {{ nft.name }}
        v-card-subtitle {{ nft.collection_name }}
        v-card-actions
          v-btn( color="blue-grey-darken-4" variant="text") More
          v-spacer
          v-btn(
            :icon="show[index] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            @click="show[index] ?  show[index] = false : show[index] = true"
          )
        v-expand-transition
          div(v-show="show[index]")
            v-divider
            v-card-text
              p.mb-3 Creator: {{ nft.creator_address }}
              p.mb-3 Royalty: {{ (nft.royalty_points_numerator/nft.royalty_points_denominator) * 100 }}%
    div(v-else)
      p Please Connect Wallet
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import Navbar from '@/components/Navbar.vue'

const walletAddress = ref('')
const selectedWallet = ref('')
const collection = ref({})
const address = ref('')
const nft_amount = ref(0)
const minted_nft = ref([])
const show =  ref([])
const network = ref('')

onMounted(async () => {
  await getCollection()
  await getMintedNFT()
})

async function updateAddress(e){
  walletAddress.value = e
}

function updateWallet(e) {
  selectedWallet.value = e
}

// Get Collection
async function getCollection() {
  await axios.get('https://fullnode.testnet.aptoslabs.com/v1/accounts/0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f/resource/0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f::minting::CollectionConfig')
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
      "owner_address": walletAddress.value,
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
      await axios.post(`https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql`, {
      "operationName": "TokenData",
      "variables": {
        "token_id": token.token_data_id_hash
      },
      "query": "query TokenData($token_id: String) {\n  current_token_datas(where: {token_data_id_hash: {_eq: $token_id}}) {\n    token_data_id_hash\n    name\n    collection_name\n    creator_address\n    default_properties\n    largest_property_version\n    maximum\n    metadata_uri\n    payee_address\n    royalty_points_denominator\n    royalty_points_numerator\n    supply\n    __typename\n  }\n}"
    })
      .then(response => (
        minted_nft.value.push(response.data.data.current_token_datas[0])
      ))
    });
  
}

// Generate a transaction
async function addToWhitelist(){
  const sender = walletAddress.value;
  const expiry_time = Math.round(new Date() / 1000) + 180
  var txn
  var payload = {
    type: "entry_function_payload",
    function: "0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f::minting::add_to_whitelist",
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
  const sender = walletAddress.value;
  const expiry_time = Math.round(new Date() / 1000) + 600
  var transaction
  var txn
  var payload = {
    type: "entry_function_payload",
    function: "0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f::minting::mint_nft",
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
  padding: 30px 60px;
}
</style>
