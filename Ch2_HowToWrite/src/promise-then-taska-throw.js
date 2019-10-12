function taskA() {
    console.log("Task A");
    throw new Error("throw Error @ Task A");
}
function taskB() {
    console.log("Task B");// 呼ばれない
}
function onRejected(error) {
    console.error(error);// => "throw Error @ Task A"
}
function finalTask() {
    console.log("Final Task");
}

const promise = Promise.resolve();
promise
    .then(taskA)
    .then(taskB)
    .catch(onRejected)
    .then(finalTask);