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
const population = 100; //种群数量
let MachinePartChromosomes = []; // 机器部分染色体集
let ProcessPartChromosomes = []; // 工序部分染色体集
let GS = [];
let OS = [];
// 种群初始化
function populationInit() {
  for (let i = 0; i < population; i++) {}
}
// 交叉操作
function cross(params) {}
// 工序随机选择
OS = processRandomSelection();
console.log("OS", OS);
function processRandomSelection() {
  let _osArr = [];
  jobs.forEach((ele, index) => {
    console.log();
    let _processGroup = Array(ele.length).fill(index + 1);
    _osArr = [..._osArr, ..._processGroup];
  });
  return shuffleArray(_osArr);
}
// 将一个数组打乱
function shuffleArray(array) {
  array.sort(() => Math.random() - 0.5);
  return array;
}
// 机器全局选择
// GS step1
let machineTimeList = Array(machineNum).fill(0);
machineGlobalSelection();
function machineGlobalSelection() {
  // GS step2
  let _jobs = _.cloneDeep(jobs);
  console.log("_jobs", _jobs);

  // GS step3
  let g = _jobs.length;
  while (g > 0) {
    const _random = getRandomInt(g);
    const selectRow = _jobs.splice(_random, 1);
    const gsiItem = selectSingleProcess(selectRow[0]);
    GS = [...GS, ...gsiItem];
    g--;
  }
  console.log("GS", GS);
}

function selectSingleProcess(row) {
  let _tempArr = [];
  row.forEach((ele) => {
    let _tempTime = _.cloneDeep(machineTimeList);
    let _tempProIndexs = [];
    machines.forEach((eleSon, sondex) => {
      if (ele[eleSon] !== "-") {
        _tempTime[sondex] += ele[eleSon];
        _tempProIndexs.push(sondex);
      }
      // GS step4
    });
    machineTimeList = _.cloneDeep(_tempTime);
    // 找出工序中最小载荷机器
    let _minimunValIndex = _tempProIndexs[0];
    _tempProIndexs.forEach((ele, pdex) => {
      if (_tempTime[ele] < _tempTime[_minimunValIndex]) {
        _minimunValIndex = ele;
      }
    });
    _tempArr.push(_tempProIndexs.indexOf(_minimunValIndex) + 1);
  });
  return _tempArr;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
</script>

<style>
</style>
