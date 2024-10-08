
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
    <div class="gantt" id="gantt"></div>
  </div>
</template>

<script setup>
/* eslint-disable */

import * as echarts from "echarts";
import { ref, onMounted } from "vue";
import { Mk01 } from "../assets/Mk01";
import _ from "lodash";
const tableConfig = ref([]);
const machineNum = Mk01[0][1];
const tableData = ref([]);
const population = 100; //种群数量
const Pc = 0.8; //交叉概率（0.6~0.9）
const Pm = 0.05; // 变异概率 （0.005~0.06）

const machines = getMachines(machineNum); // 所有机器
tableConfig.value = getTableConfig(machineNum);
tableData.value = originalDataVisualization(Mk01);
const jobs = getJobs(Mk01); // 工件数组
const jobsFlat = jobs.flat();
const To = getProcessNum(jobs); // 工序数
const Jobset = getJobset(jobs.length);
console.log("To", To, "\njobs", jobs);
let myChart = null;
let ganttData = [];

let MachinePartChromosomes = getMachinePartChromosomes(
  jobs,
  population,
  machines
); // 机器部分染色体集
let ProcessPartChromosomes = getProcessPartChromosomes(
  jobs,
  population,
  machines
); // 工序部分染色体集

onMounted(() => {
  let chartDom = document.getElementById("gantt");
  myChart = echarts.init(chartDom);
  // 改进的遗传算法
  main(
    MachinePartChromosomes,
    ProcessPartChromosomes,
    jobs,
    To,
    Pc,
    Pm,
    Jobset,
    jobsFlat,
    population
  );
  // fitness(MachinePartChromosomes[0], ProcessPartChromosomes[0], jobs);
});

var data = [];
var dataCount = 10;
var startTime = +new Date();
var categories = ["categoryA", "categoryB", "categoryC"];
var types = [
  { name: "JS Heap", color: "#7b9ce1" },
  { name: "Documents", color: "#bd6d6c" },
  { name: "Nodes", color: "#75d874" },
  { name: "Listeners", color: "#e0bc78" },
  { name: "GPU Memory", color: "#dc77dc" },
  { name: "GPU", color: "#72b362" },
];
// Generate mock data
categories.forEach(function (category, index) {
  var baseTime = startTime;
  for (var i = 0; i < dataCount; i++) {
    var typeItem = types[Math.round(Math.random() * (types.length - 1))];
    var duration = Math.round(Math.random() * 10000);
    data.push({
      name: typeItem.name,
      value: [index, baseTime, (baseTime += duration), duration],
      itemStyle: {
        normal: {
          color: typeItem.color,
        },
      },
    });

    baseTime += Math.round(Math.random() * 2000);
  }
});
function renderItem(params, api) {
  var machineIndex = api.value(0);
  var start = api.coord([api.value(1), machineIndex]);
  var end = api.coord([api.value(2), machineIndex]);
  var height = api.size([0, 1])[1] * 0.6;
  var rectShape = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height,
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height,
    }
  );
  return (
    rectShape && {
      type: "rect",
      transition: ["shape"],
      shape: rectShape,
      style: {
        fill: api.visual("color"),
      },
    }
  );
}
function main(mpc, ppc, xJobs, to, xPc, xPm, xJobset, xJobsFlat, xPopulation) {
  let mpcPool = mpc;
  let ppcPool = ppc;
  // 迭代次数100
  for (let i = 0; i < 50; i++) {
    // 评价每一个个体
    let _individualFitness = [];

    mpcPool.forEach((ele, index) => {
      _individualFitness.push(fitness(ele, ppcPool[index], xJobs));
    });
    console.log("迭代", i);
    // '锦标赛'选择出交叉池，交叉池数量等于种群数量
    let _mpcPool = [];
    let _ppcPool = [];
    for (let p = 0; p < xPopulation; p++) {
      const rArrIndex = getRsNums(0, to - 1, 4);
      let _minDex = rArrIndex[0];
      for (let k = 1; k < rArrIndex.length; k++) {
        if (_individualFitness[rArrIndex[k]] < _individualFitness[_minDex]) {
          _minDex = rArrIndex[k];
        }
      }
      _mpcPool.push(mpcPool[_minDex]);
      _ppcPool.push(ppcPool[_minDex]);
    }
    // 每次按顺序取两个交叉池中的元素进行下一步操作
    let _nextMpcPool = [];
    let _nextPpcPool = [];
    for (let g = 0; g < xPopulation / 2; g++) {
      let nextGenerationMpc1 = _mpcPool[2 * g];
      let nextGenerationMpc2 = _mpcPool[2 * g + 1];
      let nextGenerationPpc1 = _ppcPool[2 * g];
      let nextGenerationPpc2 = _ppcPool[2 * g + 1];
      // 判断是否交叉
      const _P1 = Math.random();
      if (_P1 < xPc) {
        [nextGenerationMpc1, nextGenerationMpc2] = machineCross(
          to,
          nextGenerationMpc1,
          nextGenerationMpc2
        );
        [nextGenerationPpc1, nextGenerationPpc2] = processCross(
          to,
          xJobset,
          nextGenerationPpc1,
          nextGenerationPpc2
        );
      }
      // 判断是否变异
      const _P2 = Math.random();
      if (_P2 < xPm) {
        [nextGenerationMpc1, nextGenerationPpc1] = mutation(
          to,
          nextGenerationMpc1,
          xJobsFlat,
          nextGenerationPpc1,
          xJobs
        );
        [nextGenerationMpc2, nextGenerationPpc2] = mutation(
          to,
          nextGenerationMpc2,
          xJobsFlat,
          nextGenerationPpc2,
          xJobs
        );
      }
      _nextMpcPool.push(nextGenerationMpc1);
      _nextMpcPool.push(nextGenerationMpc2);
      _nextPpcPool.push(nextGenerationPpc1);
      _nextPpcPool.push(nextGenerationPpc2);
    }
    mpcPool = _nextMpcPool;
    ppcPool = _nextPpcPool;
  }

  let resFitness = [];
  mpcPool.forEach((ele, index) => {
    resFitness.push(fitness(ele, ppcPool[index], xJobs));
  });
  console.log("结果是：", Math.min(...resFitness), resFitness);
  const minFitnessIndex = resFitness.indexOf(Math.min(...resFitness));
  console.log("index:___>", minFitnessIndex);

  visualizationRes(mpcPool[minFitnessIndex], ppcPool[minFitnessIndex], jobs);
}
// 适应度函数 目标：最大完工时间最小化，f=min(max(Cj))
// 计算每个个体的最大完工时间
function fitness(mpc, ppc, xJobs) {
  // 机器选择部分解码
  let Jm = []; //机器顺序矩阵
  let T = []; //时间顺序矩阵
  // console.log("mpc", mpc, "\nppc", ppc);
  let i = 0;
  xJobs.forEach((ele) => {
    let _machRow = [];
    let _timeRow = [];
    ele.forEach((eleSon) => {
      _machRow.push(eleSon["machineTimeMatrix"][mpc[i] - 1][0]);
      _timeRow.push(eleSon["machineTimeMatrix"][mpc[i] - 1][1]);
      i++;
    });
    Jm.push(_machRow);
    T.push(_timeRow);
  });
  // console.log("Jm", Jm, "\nT", T);

  // 工序排序部分解码
  // 转换成 O(jh) 第j个工件的第h道工序
  // 首先求解出工序索引(h)矩阵：相当于每个工件的工序的索引，和工序排序染色体中的基因一一对应
  let _hasCal = [];
  let hMatrix = [];
  ppc.forEach((ele) => {
    _hasCal.push(ele);
    hMatrix.push(_hasCal.filter((gene) => gene === ele).length);
  });
  // console.log("hMatrix", hMatrix);
  //
  let Ojh = {}; // 工序层面 工件j的第h道工序
  let Mijh = {}; // 机器层面  工件j的第h道工序在机器i上加工
  machines.forEach((ele) => {
    Mijh[ele] = [];
  });
  ppc.forEach((ele, index) => {
    const machineKey = `machine${Jm[ele - 1][hMatrix[index] - 1]}`;
    const j = ele;
    const h = hMatrix[index];
    const duration = T[ele - 1][hMatrix[index] - 1];

    let _res = { _St: 0, _Et: 0 };

    if (Mijh[machineKey].length === 0) {
      // 在机器mi是第一道加工工序
      if (h === 1) {
        // 是工件的第一道工序
        _res._St = 0;
        _res._Et = duration;
      } else {
        // 开始时间 则是上一道工序的结束时间
        _res._St = Ojh[`O${j}${h - 1}`].Et;
        _res._Et = _res._St + duration;
        // console.log('_res',_res,'Ojh',`O${j}${h}` )
      }
      Mijh[machineKey].push({
        process: `O${j}${h}`,
        St: _res._St,
        Et: _res._Et,
      });
    } else {
      // 否则找到机器mi上所有间隔空闲时间段[TSi,TEi],注：当前工序前一道工序Oj(h-1)的结束时间后的才是有效区间
      let idlePeriod = [];
      // 从第一个工序前的空白开始
      Mijh[machineKey].forEach((ele, index) => {
        if (index === 0) {
          idlePeriod.push([0, ele.St]);
        } else {
          idlePeriod.push([Mijh[machineKey][index - 1].Et, ele.St]);
        }
      });
      // 找到Ojh最早开始加工时间 ta ,能满足工件加工工序的顺序约束：ta=max{Cj(h-1),TSi}
      // 插入条件是:ta + Pijh <= TEi
      // 如果不满足插入条件，则按照时间tb在机器Mi上加工，tb=max{Cj(h-1),LMi} LMi表示当前机器最后一道工序的结束时间
      // 找出第一个可以插入的空闲区间
      let firstSparePeriod = [];
      let i = 0;
      let ta = 0;
      // console.log('Ojh',Ojh,'`\n O${j}${h-1}`',`O${j}${h-1}`)

      while (i < idlePeriod.length) {
        if (h === 1) {
          ta = Math.max(0, idlePeriod[i][0]);
        } else {
          ta = Math.max(Ojh[`O${j}${h - 1}`].Et, idlePeriod[i][0]);
        }
        if (idlePeriod[i][1] - ta >= duration) {
          firstSparePeriod.push({ fspdex: i, period: idlePeriod[i] });
          break;
        }
        i++;
      }
      if (firstSparePeriod.length) {
        Mijh[machineKey].splice(firstSparePeriod[0].fspdex, 0, {
          process: `O${j}${h}`,
          St: ta,
          Et: ta + duration,
        });
        _res._St = ta;
        _res._Et = ta + duration;
      } else {
        // 如果没有可插入空间则安排到当前机器最后一道工序的结束时间
        const lastEle = Mijh[machineKey][Mijh[machineKey].length - 1];
        let tb = 0;
        if (h - 1 === 0) {
          tb = Math.max(0, lastEle["Et"]);
        } else {
          tb = Math.max(Ojh[`O${j}${h - 1}`].Et, lastEle["Et"]);
        }
        Mijh[machineKey].push({
          process: `O${j}${h}`,
          St: tb,
          Et: tb + duration,
        });
        _res._St = tb;
        _res._Et = tb + duration;
      }
    }

    Ojh[`O${j}${h}`] = {
      job: j,
      process: h,
      color: `hsl(${j * 43} 75% 60%)`,
      machine: machineKey,
      machineIndex: Jm[ele - 1][hMatrix[index] - 1] - 1,
      duration: duration,
      St: _res._St,
      Et: _res._Et,
    };
  });
  // 最大完工时间
  return getMaxEndTime(Mijh);
}
function visualizationRes(mpc, ppc, xJobs) {
  // 机器选择部分解码
  let Jm = []; //机器顺序矩阵
  let T = []; //时间顺序矩阵
  // console.log("mpc", mpc, "\nppc", ppc);
  let i = 0;
  xJobs.forEach((ele) => {
    let _machRow = [];
    let _timeRow = [];
    ele.forEach((eleSon) => {
      _machRow.push(eleSon["machineTimeMatrix"][mpc[i] - 1][0]);
      _timeRow.push(eleSon["machineTimeMatrix"][mpc[i] - 1][1]);
      i++;
    });
    Jm.push(_machRow);
    T.push(_timeRow);
  });
  // console.log("Jm", Jm, "\nT", T);

  // 工序排序部分解码
  // 转换成 O(jh) 第j个工件的第h道工序
  // 首先求解出工序索引(h)矩阵：相当于每个工件的工序的索引，和工序排序染色体中的基因一一对应
  let _hasCal = [];
  let hMatrix = [];
  ppc.forEach((ele) => {
    _hasCal.push(ele);
    hMatrix.push(_hasCal.filter((gene) => gene === ele).length);
  });
  // console.log("hMatrix", hMatrix);
  //
  let Ojh = {}; // 工序层面 工件j的第h道工序
  let Mijh = {}; // 机器层面  工件j的第h道工序在机器i上加工
  machines.forEach((ele) => {
    Mijh[ele] = [];
  });
  ppc.forEach((ele, index) => {
    const machineKey = `machine${Jm[ele - 1][hMatrix[index] - 1]}`;
    const j = ele;
    const h = hMatrix[index];
    const duration = T[ele - 1][hMatrix[index] - 1];

    let _res = { _St: 0, _Et: 0 };

    if (Mijh[machineKey].length === 0) {
      // 在机器mi是第一道加工工序
      if (h === 1) {
        // 是工件的第一道工序
        _res._St = 0;
        _res._Et = duration;
      } else {
        // 开始时间 则是上一道工序的结束时间
        _res._St = Ojh[`O${j}${h - 1}`].Et;
        _res._Et = _res._St + duration;
        // console.log('_res',_res,'Ojh',`O${j}${h}` )
      }
      Mijh[machineKey].push({
        process: `O${j}${h}`,
        St: _res._St,
        Et: _res._Et,
      });
    } else {
      // 否则找到机器mi上所有间隔空闲时间段[TSi,TEi],注：当前工序前一道工序Oj(h-1)的结束时间后的才是有效区间
      let idlePeriod = [];
      // 从第一个工序前的空白开始
      Mijh[machineKey].forEach((ele, index) => {
        if (index === 0) {
          idlePeriod.push([0, ele.St]);
        } else {
          idlePeriod.push([Mijh[machineKey][index - 1].Et, ele.St]);
        }
      });
      // 找到Ojh最早开始加工时间 ta ,能满足工件加工工序的顺序约束：ta=max{Cj(h-1),TSi}
      // 插入条件是:ta + Pijh <= TEi
      // 如果不满足插入条件，则按照时间tb在机器Mi上加工，tb=max{Cj(h-1),LMi} LMi表示当前机器最后一道工序的结束时间
      // 找出第一个可以插入的空闲区间
      let firstSparePeriod = [];
      let i = 0;
      let ta = 0;
      // console.log('Ojh',Ojh,'`\n O${j}${h-1}`',`O${j}${h-1}`)

      while (i < idlePeriod.length) {
        if (h === 1) {
          ta = Math.max(0, idlePeriod[i][0]);
        } else {
          ta = Math.max(Ojh[`O${j}${h - 1}`].Et, idlePeriod[i][0]);
        }
        if (idlePeriod[i][1] - ta >= duration) {
          firstSparePeriod.push({ fspdex: i, period: idlePeriod[i] });
          break;
        }
        i++;
      }
      if (firstSparePeriod.length) {
        Mijh[machineKey].splice(firstSparePeriod[0].fspdex, 0, {
          process: `O${j}${h}`,
          St: ta,
          Et: ta + duration,
        });
        _res._St = ta;
        _res._Et = ta + duration;
      } else {
        // 如果没有可插入空间则安排到当前机器最后一道工序的结束时间
        const lastEle = Mijh[machineKey][Mijh[machineKey].length - 1];
        let tb = 0;
        if (h - 1 === 0) {
          tb = Math.max(0, lastEle["Et"]);
        } else {
          tb = Math.max(Ojh[`O${j}${h - 1}`].Et, lastEle["Et"]);
        }
        Mijh[machineKey].push({
          process: `O${j}${h}`,
          St: tb,
          Et: tb + duration,
        });
        _res._St = tb;
        _res._Et = tb + duration;
      }
    }

    Ojh[`O${j}${h}`] = {
      job: j,
      process: h,
      color: `hsl(${j * 43} 75% 60%)`,
      machine: machineKey,
      machineIndex: Jm[ele - 1][hMatrix[index] - 1] - 1,
      duration: duration,
      St: _res._St,
      Et: _res._Et,
    };
  });
  console.log("Ojh", Ojh, "\nMijh", Mijh);
  ganttData = getGanttData(Ojh);
  let ganttOption = getGanttOption(ganttData);
  myChart.setOption(ganttOption);
}
function getMaxEndTime(mijh) {
  let _max = 0;
  for (const key in mijh) {
    if (mijh[key][mijh[key].length - 1].Et > _max) {
      _max = mijh[key][mijh[key].length - 1].Et;
    }
  }
  return _max;
}
function getGanttData(obj) {
  let _data = [];
  for (const key in obj) {
    _data.push({
      name: key,
      value: [
        obj[key]["machineIndex"],
        obj[key]["St"],
        obj[key]["Et"],
        obj[key]["duration"],
      ],
      itemStyle: {
        color: obj[key]["color"],
      },
    });
  }
  return _data;
}

function getGanttOption(data) {
  return {
    tooltip: {
      formatter: function (params) {
        return params.marker + params.name + ": " + params.value[3] + " min";
      },
    },
    title: {
      text: "GA-FJSP",
      left: "center",
    },
    dataZoom: [
      {
        type: "slider",
        filterMode: "weakFilter",
        showDataShadow: false,
        top: 400,
        labelFormatter: "",
      },
      {
        type: "inside",
        filterMode: "weakFilter",
      },
    ],
    grid: {
      height: 300,
    },
    xAxis: {
      min: 0,
      scale: true,
      axisLabel: {
        formatter: function (val) {
          return Math.max(0, val) + " min";
        },
      },
    },
    yAxis: {
      data: machines,
    },
    series: [
      {
        type: "custom",
        renderItem: renderItem,
        itemStyle: {
          opacity: 0.8,
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: data,
      },
    ],
  };
}
function getMachinePartChromosomes(xJobs, xPopulation, xMachines) {
  let _res = [];
  for (let i = 0; i < xPopulation; i++) {
    _res.push(machineGlobalSelection(xJobs, xMachines));
  }
  return _res;
}
function getProcessPartChromosomes(xJobs, xPopulation) {
  let _res = [];
  for (let i = 0; i < xPopulation; i++) {
    _res.push(processRandomSelection(xJobs));
  }
  return _res;
}
// 机器全局选择
function machineGlobalSelection(xJobs, xMachines) {
  let _tempArr = [];
  let xMachineTimeList = Array(xMachines.length).fill(0);
  const selectionQueue = generateUniqueRandomNumbers(0, xJobs.length - 1);
  selectionQueue.forEach((ele) => {
    const gsiItem = selectSingleProcess(
      xJobs[ele],
      xMachineTimeList,
      xMachines
    );
    _tempArr.push({ order: ele, code: gsiItem });
  });
  _tempArr.sort((a, b) => {
    return a.order - b.order;
  });
  return _tempArr.map((ele) => ele.code).reduce((a, b) => a.concat(b), []);
}
function generateUniqueRandomNumbers(min, max) {
  const arrayLength = max - min + 1;
  const randomNumbers = new Set();
  while (randomNumbers.size < arrayLength) {
    const randomnumber = min + Math.floor(Math.random() * arrayLength);
    randomNumbers.add(randomnumber);
  }
  return [...randomNumbers];
}
// function getRandomInt(max) {
//   return Math.floor(Math.random() * max);
// }
function selectSingleProcess(row, xMachineTimeList, xMachines) {
  let _tempArr = [];
  row.forEach((ele) => {
    let preMachineTimeList = _.cloneDeep(xMachineTimeList);
    let _tempProIndexs = [];
    xMachines.forEach((eleSon, sondex) => {
      if (ele[eleSon] !== "-") {
        preMachineTimeList[sondex] += ele[eleSon];
        _tempProIndexs.push(sondex);
      }
    });

    // 找出工序中最小载荷机器
    let _minimunValIndex = _tempProIndexs[0];
    _tempProIndexs.forEach((ele) => {
      if (preMachineTimeList[ele] < preMachineTimeList[_minimunValIndex]) {
        _minimunValIndex = ele;
      }
    });
    // console.log('preMachineTimeList',preMachineTimeList,'xMachineTimeList',xMachineTimeList,'_tempProIndexs',_tempProIndexs,'_minimunValIndex',_minimunValIndex)
    xMachineTimeList[_minimunValIndex] += preMachineTimeList[_minimunValIndex];
    _tempArr.push(_tempProIndexs.indexOf(_minimunValIndex) + 1);
  });
  return _tempArr;
}
function getMachines(num) {
  let i = 1;
  let _machines = [];
  while (i <= num) {
    _machines.push("machine" + i);
    i++;
  }
  return _machines;
}
function getTableConfig(num) {
  let i = 1;
  let _tableConfig = [];
  while (i <= num) {
    _tableConfig.push({ prop: "machine" + i, name: "机器" + i });
    i++;
  }
  _tableConfig.unshift({ prop: "processName", name: "工序" });
  _tableConfig.unshift({ prop: "job", name: "工件" });
  return _tableConfig;
}
function getJobs(list) {
  let _jobs = [];
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
      const row = { processName: "J" + j + (index + 1), machineTimeMatrix: [] }; // machine-TimeMatrix:[机器,时间]矩阵
      ele.forEach((eleSon, sondex) => {
        if (sondex % 2 === 0) {
          row[machines[eleSon - 1]] = ele[sondex + 1];
        }
      });
      machines.forEach((eleMac, macDex) => {
        if (!(eleMac in row)) {
          row[eleMac] = "-";
        } else {
          row["machineTimeMatrix"].push([macDex + 1, row[eleMac]]);
        }
      });
      // 合并单元格
      if (index === 0) {
        row.rowSpan = jobItems.length;
      } else {
        row.rowSpan = 0;
      }
      row.job = "job" + j;
      _jobObj.push(row);
    });
    _jobs.push(_jobObj);
    j++;
  }
  return _jobs;
}
// 将原始数据可视化处理
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
    j++;
  }
  return _tableData;
}
function objectSpanMethod({ row, columnIndex }) {
  if (columnIndex === 0) {
    return {
      rowspan: row.rowSpan,
      colspan: 1,
    };
  }
}

// function getOjh(target,list) {}
// 选择操作
// function selection(params) {}
// 工序随机选择
function processRandomSelection(xJobs) {
  let _osArr = [];
  xJobs.forEach((ele, index) => {
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

function getProcessNum(list) {
  return list.reduce((pre, cur) => {
    return pre + cur.length;
  }, 0);
}
// 机器部分交叉操作
// machineCross(To, MachinePartChromosomes[0], MachinePartChromosomes[1]);
function machineCross(to, mp1, mp2) {
  // 生成r个互不相等的随机数
  let rArr = getRsNums(1, to - 1);
  // console.log("mp1", mp1, "\n mp2", mp2);
  let mc1 = Array(to).fill(null);
  let mc2 = Array(to).fill(null);
  for (let i = 0; i < to; i++) {
    if (rArr.includes(i + 1)) {
      mc1[i] = mp1[i];
      mc2[i] = mp2[i];
    } else {
      mc1[i] = mp2[i];
      mc2[i] = mp1[i];
    }
  }
  // console.log("mc1", mc1, "\n mc2", mc2);
  return [mc1, mc2];
}
// 工序部分交叉操作
// processCross(To,Jobset, ProcessPartChromosomes[0], ProcessPartChromosomes[1]);

function processCross(to, jobset, pp1, pp2) {
  const _jobset = shuffleArray(jobset);
  let _random = getRandomNumber(1, jobset.length - 2);
  let jobset1 = _jobset.slice(0, _random);
  let jobset2 = _jobset.slice(_random);
  let pc1 = Array(to).fill(null);
  let pc2 = Array(to).fill(null);
  let _remained1 = [];
  let _remained2 = [];
  for (let i = 0; i < to; i++) {
    if (jobset1.includes(pp1[i])) {
      pc1[i] = pp1[i];
    }
    if (!jobset1.includes(pp2[i])) {
      _remained1.push(pp2[i]);
    }
    if (jobset2.includes(pp2[i])) {
      pc2[i] = pp2[i];
    }
    if (!jobset2.includes(pp1[i])) {
      _remained2.push(pp1[i]);
    }
  }

  for (let i = 0; i < to; i++) {
    if (pc1[i] === null) {
      pc1[i] = _remained1.shift();
    }
    if (pc2[i] === null) {
      pc2[i] = _remained2.shift();
    }
  }
  // console.log("jobset1",jobset1,"\npc1",pc1,"\npp1",pp1,"\n_remained1",_remained1,"\njobset2",jobset2,"\npc2",pc2,"\npp2",pp2,"\n_remained2",_remained2);
  return [pc1, pc2];
}
function championshipsSelection(params) {
  // 每次选择的个体
  const _selectNum = 4;
}
// mutation(
//   To,
//   MachinePartChromosomes[0],
//   jobsFlat,
//   ProcessPartChromosomes[0],
//   jobs
// );

function mutation(to, mpc, xJobsFlat, ppc, xJobs) {
  let _machineGene = machineMutation(to, mpc, xJobsFlat);
  let _processGeneCandidate = processMutation(to, ppc);
  let _tempFitness = []; //
  _processGeneCandidate.forEach((ele) => {
    _tempFitness.push(fitness(_machineGene, ele, xJobs));
  });
  // console.log("_tempFitness", _tempFitness);
  let _minVal = Math.min(..._tempFitness);
  let _maxIndex = _tempFitness.findIndex((ele) => ele === _minVal);
  // console.log("_minVal", _minVal, "\n _maxIndex", _maxIndex);
  return [_machineGene, _processGeneCandidate[_maxIndex]]; // [mpc,ppc]
}
// machineMutation(To,MachinePartChromosomes[0],jobsFlat)
// 机器部分变异
function machineMutation(to, mpc, xJobsFlat) {
  const rArr = getRsNums(0, to - 1);
  const _res = _.cloneDeep(mpc);
  rArr.forEach((ele) => {
    const _tempMTM = xJobsFlat[ele].machineTimeMatrix;
    // 找出加工时间最短的机器
    let _minIndex = 0;
    let _minVal = _tempMTM[0][1];
    _tempMTM.forEach((eleSon, sondex) => {
      if (sondex > 0) {
        if (_minVal > eleSon[1]) {
          _minVal = eleSon[1];
          _minIndex = sondex;
        }
      }
    });
    _res[ele] = _minIndex + 1;
  });
  return _res;
}
// 工序部分变异(基于领域搜索变异)
// processMutation(To, ProcessPartChromosomes[0]);
function processMutation(to, ppc) {
  // r个不同基因的索引
  const rArrIndex = getRsNums(0, to - 1, 4);
  let geneArr = [];
  rArrIndex.forEach((ele) => {
    geneArr.push(ppc[ele]);
  });
  // console.log("rArrIndex", rArrIndex, "\ngeneArr", geneArr, "\n ppc", ppc);
  const ordering = permute(geneArr);
  // console.log("ordering", ordering);

  const uniQueOrdering = twoDimensionalUnique(ordering);
  // console.log("ordering", ordering, "\n uniQueOrdering", uniQueOrdering);
  // 将组合映射回去
  let candidateMutations = [];
  uniQueOrdering.forEach((ele) => {
    let _temp = _.cloneDeep(ppc);
    rArrIndex.forEach((eleSon, sondex) => {
      _temp[eleSon] = ele[sondex];
    });
    candidateMutations.push(_temp);
  });
  // console.log("candidateMutations", candidateMutations);
  // 求解适应度值
  return candidateMutations;
}

// 二维数组去重
function twoDimensionalUnique(towDimenArr) {
  let uniqueStringArr = [];
  let uniqueArr = [];
  towDimenArr.forEach((ele) => {
    if (!uniqueStringArr.includes(ele.toString())) {
      uniqueStringArr.push(ele.toString());
      uniqueArr.push(ele);
    }
  });
  return uniqueArr;
}
// 获取数组的全部排列组合
function permute(arr, n = arr.length) {
  if (n === 1) {
    return [arr];
  }
  let result = [];
  for (let i = 0; i < n; i++) {
    const curr = arr.splice(i, 1);
    const subPermute = permute(arr, n - 1);
    for (let j = 0; j < subPermute.length; j++) {
      result.push([...curr, ...subPermute[j]]);
    }
    arr.splice(i, 0, curr[0]);
  }
  return result;
}
function getJobset(to) {
  let _set = [];
  for (let i = 0; i < to; i++) {
    _set.push(i + 1);
  }
  return _set;
}
// 随机生成 R 个在取件（a,b）之间互不相等的数组,可选：c个数,默认随机
function getRsNums(a, b, c = null) {
  let r = c || getRandomNumber(a, b);
  // 生成r个互不相等的随机数
  let i = 0;
  let rArr = [];
  do {
    let _r = getRandomNumber(a, b);
    if (!rArr.includes(_r)) {
      rArr.push(_r);
      i++;
    }
  } while (i < r);
  rArr.sort((a, b) => a - b);
  return rArr;
}
// 生成一个区间[a,b]之间的随机数，a,b 可以取到
function getRandomNumber(a, b) {
  return Math.floor(Math.random() * (b - a + 1) + a);
}
</script>

<style scoped>
.gantt {
  width: 800px;
  height: 600px;
  border: 1px solid #000;
  border-radius: 5px;
}
</style>