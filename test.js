const arr = [
    "a", "b", "c", "d", "e"
]


setInterval(() => {
    const random = parseInt(Math.random() * 5)
    console.log(arr[random]);
}, 1000);