<template>
  <div></div>
</template>

<script>
import { payed } from "../assets/list2";
import { all } from "../assets/list1";
export default {
  mounted() {
    let _unpayed = [];
    all.forEach((ele) => {
      if (payed.includes(ele)) {
        //
      } else {
        _unpayed.push(ele);
      }
    });
    console.log("未缴费名单:", _unpayed);
  },
};
</script>

<style>
</style>