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
const tableData = ref([]);
const population = 1; //种群数量


const machines = getMachines(machineNum); // 所有机器
tableConfig.value = getTableConfig(machineNum);
tableData.value = originalDataVisualization(Mk01);
const jobs = getJobs(Mk01); // 工件数组
const To = getProcessNum(jobs); // 工序数

console.log('To',To, "\njobs", jobs);

let MachinePartChromosomes = getMachinePartChromosomes(jobs,population,machines); // 机器部分染色体集
let ProcessPartChromosomes = getProcessPartChromosomes(jobs,population,machines); // 工序部分染色体集

fitness(MachinePartChromosomes[0], ProcessPartChromosomes[0],jobs);

// cross(To);

// 适应度函数 目标：最大完工时间最小化，f=min(max(Cj))
// 计算每个个体的最大完工时间
function fitness(mpc, ppc,xJobs) {
  // 机器选择部分解码
  let Jm = []; //机器顺序矩阵
  let T = []; //时间顺序矩阵
  console.log("mpc", mpc,'\nppc', ppc);
  let i = 0
  xJobs.forEach((ele)=>{
    let _machRow=[]
    let _timeRow=[]
    ele.forEach(eleSon=>{
      console.log('-----',i,mpc[i]-1,eleSon['machineTimeMatrix'])
      _machRow.push(eleSon['machineTimeMatrix'][mpc[i]-1][0] )
      _timeRow.push(eleSon['machineTimeMatrix'][mpc[i]-1][1] )
      i++
    })
    Jm.push(_machRow)
    T.push(_timeRow)
  })
  console.log("Jm", Jm,'T',T);

  // 工序排序部分解码
  // 转换成 O(jh) 第j个工件的第h道工序
  // 首先求解出工序索引(h)矩阵：相当于每个工件的工序的索引，和工序排序染色体中的基因一一对应
  let _hasCal=[]
  let hMatrix=[]
  ppc.forEach(ele=>{
    _hasCal.push(ele)
    hMatrix.push(_hasCal.filter(gene=>gene===ele).length)
  })
  console.log('hMatrix',hMatrix)
  // 
  let Ojh={} // 工序层面
  let Mi = {} // 机器层面
  machines.forEach(ele=>{
    Mi[ele]=[]
  })
  ppc.forEach((ele,index)=>{
    let _SEObj= getOpStartEnd(Mi,`machine${Jm[ele-1][hMatrix[index]-1]}`,ele,hMatrix[index],Ojh,T[ele-1][hMatrix[index]-1])
    Ojh[`O${ele}${hMatrix[index]}`]={machine:Jm[ele-1][hMatrix[index]-1],duration:T[ele-1][hMatrix[index]-1],St:_SEObj._St,Et:_SEObj._Et}

  })
  console.log('-------mmm',Ojh,Mi) 
}
function getMachinePartChromosomes(xJobs,xPopulation,xMachines){
  let _res=[]
  for (let i = 0; i < xPopulation; i++) {
    _res.push(machineGlobalSelection(xJobs,xMachines));
  }
  return _res
}
function getProcessPartChromosomes(xJobs,xPopulation){
 let _res=[]
  for (let i = 0; i < xPopulation; i++) {
    _res.push(processRandomSelection(xJobs));
  }
  return _res
}
// 机器全局选择
function machineGlobalSelection(xJobs,xMachines) {
  let _tempArr = [];
  let _jobs = _.cloneDeep(xJobs);
  let g = _jobs.length;
  let xMachineTimeList = Array(xMachines.length).fill(0)
  while (g > 0) {
    const _random = getRandomInt(g);
    const selectRow = _jobs.splice(_random, 1);
    const gsiItem = selectSingleProcess(selectRow[0],xMachineTimeList,xMachines);
    _tempArr = [..._tempArr, ...gsiItem];
    g--;
  }
  return _tempArr;
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
function selectSingleProcess(row,xMachineTimeList,xMachines) {
  let _tempArr = [];
  row.forEach((ele) => {
    let preMachineTimeList=_.cloneDeep(xMachineTimeList)
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
    console.log('preMachineTimeList',preMachineTimeList,'xMachineTimeList',xMachineTimeList,'_tempProIndexs',_tempProIndexs,'_minimunValIndex',_minimunValIndex)
    xMachineTimeList[_minimunValIndex]+=preMachineTimeList[_minimunValIndex]
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
      const row = { processName: "J" + j + (index + 1),machineTimeMatrix:[] };// machine-TimeMatrix:[机器,时间]矩阵
      ele.forEach((eleSon, sondex) => {
        if (sondex % 2 === 0) {
          row[machines[eleSon - 1]] = ele[sondex + 1];
        }
      });
      machines.forEach((eleMac,macDex) => {
        if (!(eleMac in row)) {
          row[eleMac] = "-";
        }else{
          row['machineTimeMatrix'].push([macDex+1,row[eleMac]])
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
function getOpStartEnd(mi,machineKey,j,h,ojh,duration) {
  let _res={_St:0,_Et:0}
  // let _hasOp=
  if(mi[machineKey].length===0){// 在机器mi是第一道加工工序
    if(h===1){// 是工件的第一道工序
      _res._St=0
      _res._Et=duration
    }else{// 开始时间 则是上一道工序的结束时间
      _res._St=ojh[`O${j}${h}`].Et
      _res._Et=_res._St+duration
    }
  }else{ // 否则找到机器mi上所有间隔空闲时间段[TSi,TEi]
    // let idlePeriod=[]
  }

  return _res
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
// 交叉操作
// function cross(to) {
//   let r = getRandomNumber(1, to - 1);
//   // 生成r个互不相等的随机数
//   let i = 0;
//   let rArr = [];
//   do {
//     let _r = getRandomNumber(1, to - 1);
//     if (!rArr.includes(_r)) {
//       rArr.push(_r);
//       i++;
//     }
//   } while (i < r);
// }
// 生成一个区间[a,b]之间的随机数，a,b 可以取到
// function getRandomNumber(a, b) {
//   return Math.floor(Math.random() * (b - a + 1) + a);
// }
</script>

<style>
</style>
