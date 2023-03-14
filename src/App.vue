<template lang="pug">
v-app.main-font()
  Navbar(@hasWallet="updateWallet($event)")
  v-main()
    router-view(:hasWallet="wallet")
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'
import { ref } from 'vue'


const wallet = ref(false)

function updateWallet(e) {
  wallet.value = e
}
</script>
