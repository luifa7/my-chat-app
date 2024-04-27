<script setup>
import ChatWindow from "./components/ChatWindow.vue";
</script>

<template>
  <div class="title-container">
    <h1 class="split-title">Project Split</h1>
  </div>
  <ChatWindow />
  <!-- Use the ChatWindow component here -->
</template>

<style scoped>
.title-container {
  text-align: center;
  margin: 20px 0;
}

.split-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  position: relative;
  display: inline-block;
}

.split-title::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 50%;
  bottom: 0;
  left: 0;
  background: black;
  z-index: -1;
  transform: skewY(-6deg);
}
</style>
