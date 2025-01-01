export default function getSequence(arr: number[]): number[] {
  const result = [0];
  const p = result.slice(0); //记录每个位置的索引
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    //为了vue3处理当里头为0表示的是创建所以不进行加入里头
    if (element !== 0) {
      if (element > arr[result[result.length - 1]]) {
        //如果最后一项大就直接扔进去
        p.push(result[result.length - 1]); // 上一个节点是啥
        result.push(i);
        continue;
      }
    }
    //使用二分法查找比他大的项
    let start = 0;
    let end = result.length - 1;
    let middle = 0;
    while (start < end) {
      middle = ((start + end) / 2) | 0;
      if (element > arr[result[middle]]) {
        //如果大于这个就向右找
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (element < arr[result[start]]) {
      //因为result[start]是索引 回原数组拿这个值做比较
      console.log(i);
      //如果当前值小于二分查找出来的就直接替换 因为更有潜力
      p[i] = result[start - 1]; //当前节点的上一个节点
      result[start] = i;
    }
  }
  //根据p这个前序列表进行查找 生成出最后的连续递增子序列
  //因为最后一项一定是正确的 所以只需要根据最后一项依次往前找就好
  // debugger;
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }
  console.log(p);
  console.log(result);
  return result;
}
getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]);
//2
// 2 3
//1 3
//13
//1356
//13568
//13567
//135679
//134679
//21
