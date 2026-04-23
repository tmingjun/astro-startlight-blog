---
title: Linux 内核 kthread worker 机制详解
description: kthread worker；Linux内核
---
# Linux 内核 kthread worker 机制详解（原理 + 接口使用 + 源码实现）

## 1. 什么是 kthread worker

kthread worker 是 Linux 内核提供的一种异步任务执行机制，本质上是：

- 一个专属内核线程（kthread）
- 一个待执行 work 队列

它兼具 workqueue 的易用性，以及 kthread 的可控性。

---

## 2. 为什么需要它

相比 system_wq 共享线程池，kthread worker 具备：

- 独占线程，减少竞争
- 可绑定 CPU
- 可设置优先级
- 更稳定的 IO 时延
- 更容易定位问题

适合 NVMe、块层、网络驱动等高性能路径。

---

## 3. 核心数据结构

头文件：`include/linux/kthread.h`

### struct kthread_worker

```c
struct kthread_worker {
    spinlock_t lock;
    struct list_head work_list;
    struct task_struct *task;
    struct kthread_work *current_work;
};
```

### struct kthread_work

```c
struct kthread_work {
    struct list_head node;
    kthread_work_func_t func;
    struct kthread_worker *worker;
};
```

---

## 4. 常用接口

### 创建 worker

```c
worker = kthread_create_worker(0, "demo_worker");
```

### 初始化任务

```c
kthread_init_work(&work, handler);
```

### 投递任务

```c
kthread_queue_work(worker, &work);
```

### 等待完成

```c
kthread_flush_work(&work);
```

### 取消任务

```c
kthread_cancel_work_sync(&work);
```

### 销毁 worker

```c
kthread_destroy_worker(worker);
```

---

## 5. 典型示例

```c
#include <linux/module.h>
#include <linux/kthread.h>

static struct kthread_worker *worker;
static struct kthread_work mywork;

static void my_fn(struct kthread_work *work)
{
    pr_info("hello worker\n");
}

static int __init demo_init(void)
{
    worker = kthread_create_worker(0, "demo");
    kthread_init_work(&mywork, my_fn);
    kthread_queue_work(worker, &mywork);
    return 0;
}

static void __exit demo_exit(void)
{
    kthread_flush_work(&mywork);
    kthread_destroy_worker(worker);
}
```

---

## 6. 内核源码实现思路

源码位置：`kernel/kthread.c`

### kthread_queue_work()

- 加锁保护队列
- work 挂入 worker->work_list
- wake_up_process(worker->task)

### kthread_worker_fn()

线程主循环：

```c
while (!kthread_should_stop()) {
    取出一个 work;
    执行 work->func(work);
}
```

---

## 7. 与 workqueue 对比

| 项目 | workqueue | kthread worker |
|---|---|---|
| 线程 | 系统共享 | 私有线程 |
| 实时性 | 中 | 高 |
| CPU 绑定 | 一般 | 强 |
| 调试性 | 一般 | 强 |
| 场景 | 普通异步任务 | 高性能 IO |

---

## 8. 常见坑

### 重复投递同一 work

同一个 work 未执行完再次 queue，通常失败。

### 模块退出未 flush

可能导致回调访问已释放对象。

### 回调里能否睡眠

可以。因为运行在线程上下文。

---

## 9. 调试方法

```bash
ps -ef | grep demo
cat /proc/<pid>/stack
cat /proc/<pid>/sched
```

---

## 10. 面试总结

- workqueue = 系统线程池
- kthread worker = 私有线程池（单线程版）
- 高性能驱动优先考虑 kthread worker
- 普通异步任务使用 workqueue 即可

---

## 11. 推荐源码阅读顺序

```text
include/linux/kthread.h
kernel/kthread.c
```

重点函数：

- kthread_create_worker
- kthread_worker_fn
- kthread_queue_work
- kthread_flush_work
- kthread_destroy_worker

