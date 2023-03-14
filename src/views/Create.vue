<template lang="pug">
.Create
  div.pa-10
    //- collection_name: String, -
    //- collection_description: String, -
    //- collection_maximum: u64,
    //- collection_uri: String, -
    //- collection_mutate_config: vector<bool>,
    //- token_name_base: String, -
    //- royalty_payee_address: address, -
    //- token_description: String,
    //- token_maximum: u64,
    //- token_mutate_config: vector<bool>,
    //- royalty_points_den: u64,
    //- royalty_points_num: u64, -
    //- public_mint_limit_per_address: u64, -

    //- whitelist_minting_start_time: u64, -
    //- whitelist_minting_end_time: u64, -
    //- whitelist_mint_price: u64, -
    //- public_minting_start_time: u64, -
    //- public_minting_end_time: u64, -
    //- public_mint_price: u64, -
    h2.mb-5 Create Collection
    v-form(@submit.prevent="createCollection()")
      v-row
        v-col.pt-0(cols="12" md="3")
          v-text-field(label="Collection name" v-model="createForm.collection_name" variant="outlined" type="text")
        v-col.pt-0(cols="12" md="5")
          v-text-field(label="Collection image URL" v-model="createForm.collection_url" variant="outlined")
        v-col.pt-0(cols="12" md="4")
          v-text-field(label="Launch date" v-model="createForm.launch_date" variant="outlined" type="datetime-local")
      v-row
        v-col.pt-0(cols="12")
          v-textarea(label="Collection description" v-model="createForm.collection_description" variant="outlined")
      v-row
        v-col.pt-0(cols="6" md="3")
          v-text-field(label="NFT base name" v-model="createForm.base_name" variant="outlined" type="text")
        v-col.pt-0(cols="6" md="3")
          v-text-field(label="Royalty percentage" v-model="createForm.royalty" variant="outlined" type="number")
        v-col.pt-0(cols="12" md="6")
          v-text-field(label="Royalty receiver address" v-model="createForm.payee_address" variant="outlined" type="text")
      v-row
        v-col.pt-0(cols="12")
          v-btn.bg-blue-grey-darken-3(width="100%" variant="tonal" type="submit" ) Create
            
  div.pa-10
    h2.mb-5 Upload NFT assets (Image & Json)
    input(accept='image/jpeg, image/png, image/jpg, image/gif, application/json' multiple='' type='file' autocomplete='off' tabindex='-1' style='display: none;' @change="processAssets($event)" webkitdirectory mozdirectory id="fileInput")
    label(for="fileInput" style='height: 250px; width: 100%; padding: 16px; display: flex; flex-flow: row wrap; justify-content: center; align-items: center; gap: 8px; text-align: center; border-radius: 4px; border: 1px dashed rgb(102, 106, 125); cursor:pointer; background-color: var(--input-bg);')
      span(style='box-sizing: border-box; display: inline-block; overflow: hidden; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative; max-width: 100%;')
        span(style='box-sizing: border-box; display: block; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; max-width: 100%;')
          img(alt='' aria-hidden='true' :src='uploadIcon' style='display: block; max-width: 100%; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px;')
        img(:srcset='uploadIcon' :src='uploadIcon' decoding='async' data-nimg='intrinsic' style='position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%;')
      span(style='font-size: 16px; color: var(--text-second);') Click here to upload NFT assets folder
  div.pa-10(v-if="NFTMetas.length" )
    v-btn( @click="uploadImages" ) Upload
      
  div.pa-10
    h2.mb-5 Preview
    v-row(v-if="NFTMetas.length")
      v-col.pa-2(cols="6" md="3"  v-for="(nft, index) in NFTMetas" :key="index" )
        v-card.align-self-start.elevation-2.rounded-lg(max-width="250" width="100%")
          v-img( :src="nft.image" height="auto" width="100%" cover aspect-ratio="1")
          p {{ nft.name }}
    p(v-else) No assets uploaded.
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import { NFTStorage, File, Blob } from 'nft.storage'
import uploadIcon from '/src/assets/images/upload.svg'
import axios from 'axios'

const props = defineProps(['hasWallet'])
const contractAddress = '0xd8fd8f514ab7fecba27b75517d8697774ded98f4b92b55ff3db0e51c80d92c2f'

watch(
  () => props.hasWallet,
  async (hasWallet) => {
    if (hasWallet) {
      await getWallet()
    } else {
      selectedWallet.value = {}
    }
  }
)

onMounted(async () => {
  await getWallet()

})

const NFT_STORAGE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGJiZkFDMEQxNkZmRjViN2JFNGQ2MjhCOWJDOUYxNDgzRDU1MDU5MkYiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NzE0NzQ1ODczNSwibmFtZSI6IkFwdG9zIE5GVCBEZXYifQ.Z5BdXG5SwQeBgZ_cZU9DxNUeqj0faFfvDkKERfrRMyk'
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN })

const selectedWallet = ref({})
const NFTImages = ref([])
const NFTJson = []
const NFTMetas = ref([])
const createForm = ref({
  collection_name: '',
  collection_url: '',
  launch_date: '',
  collection_description: '',
  base_name: '',
  royalty: '',
  payee_address: '',
})

async function getWallet() {
  if (localStorage.getItem("SelectedWallet")) {
    selectedWallet.value = JSON.parse(localStorage.getItem("SelectedWallet"))
  }

  createForm.value.payee_address = selectedWallet.value.address
}

async function createCollection(){
  const data = createForm.value

  const sender = selectedWallet.value.address
  const expiry_time = Math.round(new Date() / 1000) + 180
  var txn
  var payload = {
    type: "entry_function_payload",
    function: `${contractAddress}::minting::set_collection_config_and_create_collection`,
    type_arguments: [],
    arguments: [
      data.collection_name,
      data.collection_description,
      0,
      data.collection_url,
      [false, false, false],
      data.base_name,
      data.payee_address,
      '',
      0,
      [false, false, false, false, false],
      10000,
      data.royalty * 100,
      0
    ]
  }

  console.log(payload);

  // if (selectedWallet.value.name === 'Martian') {
  //   await window.martian.generateSignAndSubmitTransaction(sender, payload, { expiration_timestamp_secs: expiry_time })
  //     .then(txn => {
  //       console.log('Txn', txn)
  //     })
  //     .catch(e => {
  //       alert(e.message)
  //       return
  //     })
  // }

  // if (selectedWallet.value.name === 'Pontem') {
  //   await window.pontem.signAndSubmit(payload, { expiration_timestamp_secs: expiry_time })
  //     .then(txn => {
  //       console.log('Txn', txn)
  //     })
  //     .catch(e => {
  //       alert(e.message)
  //       return
  //     })
  // }

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

  // if (selectedWallet.value.name === 'Rise') {
  //   await window.rise.signAndSubmitTransaction(payload, { expiration_timestamp_secs: expiry_time })
  //     .then(txn => {
  //       console.log('Txn', txn)
  //     })
  //     .catch(e => {
  //       alert(e.message)
  //       return
  //     })
  // }
}

async function processAssets(e) {
  e.preventDefault();
  const allowedImageType = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
  ]
  const files = e.target.files
  // console.log('All Files:',files);

  // separate image & json
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (file.name.charAt(0) === "." || file.name.charAt(0) === "_") {
      continue
    }
    if (allowedImageType.includes(file.type)) {
      NFTImages.value.push(file)
    }
    if (file.type === "application/json") {
      NFTJson.push(file)
    }
  }

  // sort image alphabetically
  NFTImages.value.sort(function (a, b) {
    var nameA = parseInt(a.name.toLowerCase().split('.')[0]), nameB = parseInt(b.name.toLowerCase().split('.')[0]);
    if (nameA < nameB) //sort string ascending
      return -1;
    if (nameA > nameB)
      return 1;
    return 0; //default return value (no sorting)
  });

  // sort json alphabetically
  NFTJson.sort(function (a, b) {
    var nameA = parseInt(a.name.toLowerCase().split('.')[0]), nameB = parseInt(b.name.toLowerCase().split('.')[0]);
    if (nameA < nameB) //sort string ascending
      return -1;
    if (nameA > nameB)
      return 1;
    return 0; //default return value (no sorting)
  });

  // change image url in json to image blob
  for (let index = 0; index < NFTJson.length; index++) {
    const json = NFTJson[index];
    const image = NFTImages.value.filter(x =>
      x.name.split('.')[0] === json.name.split('.')[0]
    );
    const meta = await parseJsonFile(json);
    meta.image = URL.createObjectURL(image[0]) //file to blob
    // console.log(meta);
    NFTMetas.value.push(meta)
  }

  console.log('Images:',NFTImages.value);
  console.log('Metas:', NFTMetas.value);
}

async function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => resolve(JSON.parse(event.target.result))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}

async function uploadImages() {
  const { cid, car } = await NFTStorage.encodeDirectory(NFTImages.value)

  // Root CID of the directory
  console.log('CID:',cid.toString())

  // Now store the CAR file on NFT.Storage
  await client.storeCar(car)

  for (let index = 0; index < NFTMetas.value.length; index++) {
    const meta = NFTMetas.value[index];
    const name = meta.name.split('#')[1]
    
    const img = NFTImages.value.filter(x =>
      x.name.split('.')[0] === name
    );
    meta.image = `https://${cid.toString()}.ipfs.nftstorage.link/${img[0].name}`
  }
  console.log('Updated Metas:', NFTMetas.value);
  uploadMetadata()
}

async function uploadMetadata() {

  const newMetas = []

  for (let index = 0; index < NFTMetas.value.length; index++) {
    const meta = NFTMetas.value[index];
    const name = meta.name.split('#')[1]
    const jsonFile = new File([JSON.stringify(meta, null, 2)], `${name}.json`)
    newMetas.push(jsonFile)
  }

  // console.log(newMetas)

  const { cid, car } = await NFTStorage.encodeDirectory(newMetas)

  // // Root CID of the directory
  console.log('CID:', cid.toString())

  // // Now store the CAR file on NFT.Storage
  await client.storeCar(car)
}
</script>

<style lang="scss" scoped>
.Create{
  padding: 50px 60px;
  padding-top: 100px;
  width: 100%;
  max-width: 1028px;
  margin: 0 auto;
}
</style>
