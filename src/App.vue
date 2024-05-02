<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <GA_FJSP />
  <Diff />
</template>

<script>
import GA_FJSP from "./components/GA_FJSP.vue";
import Diff from "./components/diff.vue";
export default {
  name: "App",
  components: {
    GA_FJSP,
    Diff,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
