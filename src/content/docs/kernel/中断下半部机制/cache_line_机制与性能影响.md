---
title: Cache Line 机制与性能影响详解
description: Cache Line
---
# Cache Line 机制与性能影响详解（面向 Linux / 驱动 / 高性能开发）

# 1. 什么是 Cache Line

CPU 访问内存时，并不是按“1字节 / 4字节 / 8字节”逐个读取主存，而是以固定块大小读取数据，这个固定块就叫：

> Cache Line（缓存行）

常见大小：

| 架构     | 常见 Cache Line |
| ------ | ------------- |
| x86_64 | 64 Bytes      |
| ARM64  | 64 Bytes（主流）  |
| 部分高端平台 | 128 Bytes     |

Linux 查看方式：

```bash
cat /sys/devices/system/cpu/cpu0/cache/index0/coherency_line_size
```

例如输出：

```bash
64
```

表示当前 CPU 的 cache line 为 64 字节。

---

# 2. CPU 为什么要按 Cache Line 读取

主存（DRAM）速度远慢于 CPU。

典型延迟（粗略）：

| 访问对象     | 延迟          |
| -------- | ----------- |
| L1 Cache | ~1ns        |
| L2 Cache | ~4ns        |
| L3 Cache | ~10ns       |
| DRAM     | ~60ns~120ns |

若 CPU 每次只取 8 字节，带宽利用率低。

因此 CPU 会一次读取整条 cache line，例如：

```text
地址 0x1000 ~ 0x103f （64B）
```

即使程序只访问其中一个 `u64`，CPU 也会把整条 line 拉入 cache。

---

# 3. 多级缓存结构

现代 CPU 通常：

```text
Core0:
  L1D Cache（数据）
  L1I Cache（指令）

多个核心共享：
  L2 / L3（依架构不同）
```

示意：

```text
CPU Core
 ├── L1 Cache（最快）
 ├── L2 Cache
 ├── L3 Cache
 └── DRAM（最慢）
```

访问路径越远，延迟越大。

---

# 4. Cache Line 的核心工作机制

# 4.1 Spatial Locality（空间局部性）

若访问：

```c
arr[0]
```

CPU 可能顺便加载：

```c
arr[1], arr[2], arr[3]...
```

因为它们可能在同一 cache line 中。

这就是数组顺序访问快的原因。

---

# 4.2 Temporal Locality（时间局部性）

刚访问过的数据，很快再次访问，大概率仍在 cache 中。

例如：

```c
counter++;
counter++;
counter++;
```

---

# 5. 为什么结构体布局影响性能

---

# 5.1 单个结构体跨多个 Cache Line

例如：

```c
struct obj {
    u64 a;
    char buf[80];
};
```

总大小 > 64B。

访问该对象时，CPU 可能需要：

```text
line0 + line1
```

若热点字段跨行：

```c
obj->a
obj->state
obj->ptr
```

则需要多次 cache fill。

---

# 5.2 热字段被推到下一行

例如：

```c
struct req {
    ...冷字段...
    int state;
    void *bio;
};
```

如果 `state/bio` 被挤到第二条 line：

原本一次访问完成，变成两次。

---

# 5.3 结构体变大，数组扫描变慢

例如：

```c
struct item arr[100000];
```

若：

| 大小   | 每64B容纳对象 |
| ---- | -------- |
| 16B  | 4个       |
| 32B  | 2个       |
| 128B | 0.5个     |

对象越大：

* cache 命中率下降
* TLB 压力增大
* 内存带宽压力增大

---

# 6. 典型性能下降原因

# 6.1 Cache Miss

CPU 访问的数据不在 cache 中：

```text
miss -> 去 L2/L3/DRAM 取
```

导致 pipeline stall。

---

# 6.2 Backend Stall

CPU 指令准备好了，但等待数据返回。

高并发 IO 路径最怕这个问题。

---

# 6.3 Prefetch 失效

CPU 会预测连续访问并提前加载。

若对象大小变化异常：

```text
112B stride -> 152B stride
```

预取效率可能下降。

---

# 6.4 TLB Miss

对象变大后，同样数量对象占更多页。

页表项压力增大，TLB miss 增加。

---

# 7. False Sharing（伪共享）

两个 CPU 修改不同变量，但变量在同一 cache line：

```c
struct stat {
    u64 cpu0_cnt;
    u64 cpu1_cnt;
};
```

CPU0 改 `cpu0_cnt`
CPU1 改 `cpu1_cnt`

虽然变量不同，但同一 line，cache coherency 会频繁失效。

结果：

* cache ping-pong
* SMP 性能下降严重

优化：

```c
struct stat {
    u64 cpu0_cnt ____cacheline_aligned;
    u64 cpu1_cnt ____cacheline_aligned;
};
```

---

# 8. Linux 内核为何重视 Cache Line

内核热点结构：

* `task_struct`
* `sk_buff`
* `bio`
* `request`
* `page`
* `inode`

都会考虑：

```text
热字段放前
冷字段后置
减少 padding
减少跨 line
避免 false sharing
```

---

# 9. 真实案例（与你场景类似）

原结构体：

```text
112 Bytes
```

新增字段后：

```text
152 Bytes
```

若插入中间：

```text
热点字段 offset 改变
跨 cacheline
吞吐下降
```

若放末尾：

```text
热点字段位置保持不变
性能恢复
```

说明：

> 字段位置往往比字段总大小更重要。

---

# 10. 结构体设计最佳实践

# 10.1 热字段放前面

```c
struct io_req {
    u32 state;
    u32 tag;
    void *ctx;

    char debug[128];
};
```

---

# 10.2 冷字段拆出去

```c
struct io_req {
    u32 state;
    void *ctx;
    struct debug_info *dbg;
};
```

---

# 10.3 减少 padding

按大小排序：

```c
u64
u64
u32
u16
u8
```

---

# 10.4 高频并发字段 cacheline 对齐

```c
____cacheline_aligned
```

---

# 11. Linux 常用分析工具

# 11.1 查看 cache line

```bash
cat /sys/devices/system/cpu/cpu0/cache/index0/coherency_line_size
```

---

# 11.2 查看结构体布局

```bash
pahole vmlinux
```

查看：

* offset
* padding
* hole
* member位置

---

# 11.3 性能统计

```bash
perf stat
perf record
perf report
```

关注：

* cache-misses
* cycles
* stalled cycles
* IPC

---

# 12. 判断某结构体是否有问题的方法

问自己：

```text
1. 是否每次 IO 都访问？
2. 是否频繁分配释放？
3. 是否多核共享？
4. 是否超过64B？
5. 热字段是否跨line？
6. 是否存在大数组扫描？
```

若多数为是，则必须优化布局。

---

# 13. 一句话经验总结

> 结构体不是逻辑组织单位，而是 cacheline 组织单位。

---

# 14. 高性能开发黄金原则

```text
让热点数据尽量停留在同一 cache line；
让不同 CPU 修改的数据分离到不同 cache line；
让冷数据远离 fast path。
```

---

# 15. 对 Linux 驱动开发者的建议

若开发：

* NVMe Target
* 网络驱动
* 中断路径
* Block Layer
* SCSI
* 文件系统 fast path

请始终关注：

```text
cache line > 算法复杂度（在热点路径里常成立）
```

---

# 16. 总结

Cache Line 是 CPU 性能核心单位。
结构体布局、对象大小、并发访问模式，都会直接影响：

* 吞吐量
* 延迟
* CPU 使用率
* 多核扩展性

理解 cache line，是从“会写代码”走向“会做性能优化”的关键一步。
