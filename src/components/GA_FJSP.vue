<template>
  <div>
    <el-table
      :data="tableData"
      border
      :span-method="objectSpanMethod"
      style="width: 800px"
    >
      <template v-for="(item, index) in tableConfig" :key="index">
        <el-table-column
          :prop="item.prop"
          :label="item.name"
          align="center"
        ></el-table-column>
      </template>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Mk01 } from "../assets/Mk01";
import _ from "lodash";
const tableConfig = ref([]);
const machineNum = Mk01[0][1];
const machines = []; // 所有机器
const tableData = ref([]);
const jobs = []; // 工件数组

let i = 1;
while (i <= machineNum) {
  machines.push("machine" + i);
  tableConfig.value.push({ prop: "machine" + i, name: "机器" + i });
  i++;
}
tableConfig.value.unshift({ prop: "processName", name: "工序" });
tableConfig.value.unshift({ prop: "job", name: "工件" });

originalDataVisualization(Mk01);
// 将原始数据可视化
function originalDataVisualization(list) {
  const _tableData = [];
  let j = 1;
  while (j < list.length) {
    const processNum = list[j][0];
    const processArr = list[j].slice(1);
    const jobItems = [];
    const _jobObj = [];
    let k = 0;
    while (k < processNum) {
      if (k === 0) {
        jobItems.push(processArr.slice(1, processArr[0] * 2 + 1));
      } else {
        let _length = 0;
        jobItems.forEach((ele) => {
          _length += ele.length;
        });
        jobItems.push(
          processArr.slice(
            _length + jobItems.length + 1,
            _length +
              jobItems.length +
              processArr[_length + jobItems.length] * 2 +
              1
          )
        );
      }
      k++;
    }
    jobItems.forEach((ele, index) => {
      const row = { processName: "J" + j + (index + 1) };
      ele.forEach((eleSon, sondex) => {
        if (sondex % 2 === 0) {
          row[machines[eleSon - 1]] = ele[sondex + 1];
        }
      });
      machines.forEach((eleMac) => {
        if (!(eleMac in row)) {
          row[eleMac] = "-";
        }
      });
      // 合并单元格
      if (index === 0) {
        row.rowSpan = jobItems.length;
      } else {
        row.rowSpan = 0;
      }
      row.job = "job" + j;
      _tableData.push(row);
      _jobObj.push(row);
    });
    jobs.push(_jobObj);
    j++;
  }
  tableData.value = _tableData;
}
function objectSpanMethod({ row, columnIndex }) {
  if (columnIndex === 0) {
    return {
      rowspan: row.rowSpan,
      colspan: 1,
    };
  }
}
/* eslint-disable */
// 种群初始化
function populationInit() {}
// 全局选择
// GS step1
let machineTimeList = Array(machineNum).fill(0);
console.log("jobs", jobs);
console.log("machineTimeList", machineTimeList);
globalSelection();
const GS = [];
function globalSelection() {
  // GS step2
  let _jobs = _.cloneDeep(jobs);
  const _random = getRandomInt(machineTimeList.length);
  const selectRow = _jobs.splice(_random, 1);
  // GS step3
  selectRow[0].forEach((ele) => {
    machines.forEach((eleSon, sondex) => {
      if (ele[eleSon] !== "-") {
      }
      machineTimeList[sondex] += ele[eleSon];
      // GS step4
    });
    console.log("---s", machineTimeList);
  });
  console.log("-----b", _random, selectRow[0], _jobs);
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
</script>

<style>
</style>
