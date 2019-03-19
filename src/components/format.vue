<template>
    <div class="export">
        <div class="title">日报生成</div>
        <el-steps :active="step" align-center>
            <el-step title="导入数据类型表"/>
            <el-step title="导入数据表"/>
            <el-step title="生成日报"/>
        </el-steps>
        <div ref="box" class="box" v-if="step === 0" v-loading="loading">
            <input @change="typefile('type')" ref="typefile" type="file" hidden>
            <template v-if="typelist.length === 0">
                <el-button size="small" @click="$refs.typefile.click()" class="center">点击选择文件</el-button>
            </template>
            <template v-else>
                <el-table :data="typelist" height="100%">
                    <el-table-column v-for="(item, i) in typehead" :key="i" :prop="'type'+i" :label="item"></el-table-column>
                </el-table>
                <div class="box-btn-bottom-right">
                    <el-button size="small" @click="$refs.typefile.click()">重新选择</el-button>
                    <el-button size="small" @click="step++">下一步</el-button>
                </div>
            </template>
        </div>
        <div class="box" v-if="step === 1" v-loading="loading">
            <input @change="datafile('data')" ref="datafile" type="file" hidden>
            <template v-if="datalist.length === 0">
                <el-button size="small" @click="$refs.datafile.click()" class="center">点击选择文件</el-button>
            </template>
            <template v-else>
                <el-table :data="data" height="100%">
                    <el-table-column v-for="(item, i) in datahead" :key="i" :prop="'data'+i" :label="item" :width="item.length * 30"></el-table-column>
                </el-table>
                <div class="box-btn-bottom-right">
                    <el-select v-model="datatime" placeholder="选择日期">
                        <el-option v-for="item in timelist" :key="item" :label="item" :value="item"></el-option>
                    </el-select>
                    <el-button size="small" @click="$refs.datafile.click()">重新选择</el-button>
                    <el-button size="small" @click="step++">生成日报</el-button>
                </div>
            </template>
            <el-button @click="step--" class="box-btn-bottom-left">上一步</el-button>
        </div>
        <div class="box auto" v-if="step === 2">
            <el-table ref="data" :data="stats" height="100%">
                <el-table-column v-for="(a, i) in statshead" :key="i" :label="a.title" :prop="a.dataIndex">
                    <el-table-column v-for="(b, n) in a.children" :key="n" :label="b.title" :prop="b.dataIndex">
                        <el-table-column v-for="(c, m) in b.children" :key="m" :prop="c.dataIndex" :label="c.title" :width="c.width * 10">
                            <el-table-column v-for="(d, k) in c.children" :key="k" :prop="d.dataIndex" :label="d.title" :width="d.width * 10"></el-table-column>
                        </el-table-column>
                    </el-table-column>
                </el-table-column>
            </el-table>
            <div class="box-btn-bottom-right">
                <el-select v-model="statstime" placeholder="选择日期">
                    <el-option v-for="item in timelist" :key="item" :label="item" :value="item"></el-option>
                </el-select>
                <el-button size="small" @click="exportData">导出</el-button>
            </div>
            <el-button size="small" @click="step--" class="box-btn-bottom-left">上一步</el-button>
        </div>
    </div>
</template>

<script>
// import { exportJsonToExcel } from '@/vendor/Export2Excel';
import xlsx from 'xlsx';

export default {
    data() {
        return {
            loading: false,
            step: 0,
            typehead: [
                '序号',
                '一级分类',
                '二级分类',
                '三级分类'
            ],
            typelist: [], // 数据类型
            datatime: '',
            datahead: [
                '申请编号',
                '当前环节',
                '单位名称（省）',
                '单位名称（地市）',
                '供电单位',
                '业务类型',
                '业务子类型',
                '受理时间',
                '受理人员',
                '受理内容',
                '客户编号',
                '客户名称',
                ' 联系人',
                ' 联系地址',
                ' 联系电话',
                '现场地址',
                '现场地址参照物',
                '工单下发时间',
                '归档时间',
                '省接单人员',
                '省处理人员',
                '省回单确认人员',
                '处理结果',
                '处理情况',
                '服务语种',
                '客户意见',
                '是否业务处理超时',
                '是否催办',
                '关联工单',
                '关联停电信息'
            ],
            datalist: [], // 数据源
            statstime: '',
            statshead: [], // 统计表头
            statslist: [], // 显示数据
            timelist: [],
            row: '供电单位', // 竖列字段
            type: '业务子类型', // 用于区分出属于竖列字段的数据
            first: '一级分类',
            two: '二级分类',
            three: '三级分类',
            time: '受理时间' // 日期
        };
    },
    computed: {
        data() {
            let item = this.datalist.filter((v, i) => v.time === this.datatime)[0];
            return item ? item.data : [];
        },
        stats() {
            let item = this.statslist.filter((v, i) => v.time === this.statstime)[0];
            return item ? item.list : [];
        }
    },
    mounted() {
        // 获取缓存数据类型
        let typelist = JSON.parse(localStorage.getItem('typelist'));
        if (typelist) this.typelist = typelist;
        // 获取一级分类编译标识
        let first = localStorage.getItem('typefirst');
        if (first) this.first = first;
        // 获取二级分类编译标识
        let two = localStorage.getItem('typetwo');
        if (two) this.two = two;
        // 获取三级分类编译标识
        let three = localStorage.getItem('typethree');
        if (three) this.three = three;
        // 获取生成结果表头
        let statshead = JSON.parse(localStorage.getItem(`statshead`));
        if (statshead) this.statshead = statshead;
    },
    methods: {
        // 导入数据类型
        typefile(name) {
            this.loading = true;
            let input = this.$refs.typefile.files[0];
            let reader = new FileReader();
            reader.onload = () => {
                let wb = xlsx.read(reader.result, {
                    type: 'binary'
                });
                let outdata = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                let data = [];
                this.typehead.forEach((v, n) => {
                    outdata.forEach((val, i) => {
                        if (v === this.first) this.first = name + n;
                        if (v === this.two) this.two = name + n;
                        if (v === this.three) this.three = name + n;
                        data[i] = { ...data[i], [name + n]: '' };
                        data[i][name + n] = val[v];
                    });
                });
                let column = [ { title: '单位名称', dataIndex: 'corp', width: 100 } ];
                data.forEach(m => {
                    var first = null;
                    column.forEach(n => {
                        if (n.title === m[this.first]) {
                            first = n;
                        }
                    });
                    if (!first) {
                        first = {
                            title: m[this.first],
                            children: []
                        };
                        column.push(first);
                    }
                    first.children.push(m);
                });

                column.forEach((v, i) => {
                    if (!v.children) return;
                    let col = [];
                    v.children.forEach((m, j) => {
                        var two = null;
                        col.forEach(n => {
                            if (n.title === m[this.two]) {
                                two = n;
                            }
                        });
                        if (!two) {
                            two = {
                                title: m[this.two],
                                children: []
                            };
                            col.push(two);
                        }
                        two.children.push({
                            title: m[this.three],
                            children: [
                                { title: '数量', dataIndex: m[this.first] + m[this.two] + m[this.three] + '数量' },
                                { title: '同比', dataIndex: m[this.first] + m[this.two] + m[this.three] + '同比' },
                                { title: '占比', dataIndex: m[this.first] + m[this.two] + m[this.three] + '占比' }
                            ]
                        });
                    });
                    col.forEach(val => {
                        val.children.push({
                            title: '小计',
                            children: [
                                { title: '数量', dataIndex: v.title + val.title + '数量' },
                                { title: '同比', dataIndex: v.title + val.title + '同比' },
                                { title: '占比', dataIndex: v.title + val.title + '占比' }
                            ]
                        });
                    });
                    col.push({
                        title: '合计',
                        children: [
                            { title: '数量', dataIndex: v.title + '数量' },
                            { title: '同比', dataIndex: v.title + '同比' },
                            { title: '占比', dataIndex: v.title + '占比' }
                        ]
                    });
                    v.children = col;
                });

                column.push({
                    title: '总计计',
                    children: [
                        { title: '数量', dataIndex: '数量' },
                        { title: '同比', dataIndex: '同比' }
                    ]
                });

                column.forEach(a => {
                    if (!a.children) return;
                    a.children.forEach(b => {
                        if (!b.children) return;
                        b.children.forEach(c => {
                            if (!c.children) return;
                            c.children.forEach(d => {
                                c.width = (c.width ? c.width : 0) + d.title.length * 5;
                            });
                            b.width = (b.width ? b.width : 0) + c.width;
                        });
                    });
                });
                this.typelist = data;
                this.statshead = column;
                localStorage.setItem(`${name}list`, JSON.stringify(data));
                localStorage.setItem(`statshead`, JSON.stringify(column));
                localStorage.setItem(`${name}first`, this.first);
                localStorage.setItem(`${name}two`, this.two);
                localStorage.setItem(`${name}three`, this.three);
                this.loading = false;
            };
            reader.readAsBinaryString(input);
        },
        // 导入数据表
        datafile(name) {
            this.loading = true;
            let input = this.$refs.datafile.files[0];
            let reader = new FileReader();
            reader.onload = () => {
                let wb = xlsx.read(reader.result, {
                    type: 'binary'
                });
                let outdata = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                let data = [];
                this.datahead.forEach((v, n) => {
                    if (v === this.row) this.row = name + n;
                    if (v === this.type) this.type = name + n;
                    if (v === this.time) this.time = name + n;
                    outdata.forEach((val, i) => {
                        data[i] = { ...data[i], [name + n]: '' };
                        data[i][name + n] = val[v];
                    });
                });
                this.$nextTick(() => {
                    let statslist = [];
                    // 过滤时间
                    data.forEach(m => {
                        var obj = null;
                        statslist.forEach(n => {
                            if (n.time === m[this.time].split(' ')[0]) {
                                obj = n;
                            }
                        });
                        if (!obj) {
                            obj = {
                                time: m[this.time].split(' ')[0],
                                data: []
                            };
                            this.timelist.push(m[this.time].split(' ')[0]);
                            statslist.push(obj);
                        }
                        obj.data.push(m);
                    });
                    this.datatime = this.statstime = this.timelist[0];
                    this.datalist = statslist;
                    this.loading = false;
                    this.generate();
                });
            };
            reader.readAsBinaryString(input);
        },
        // 生成日报
        generate() {
            let list = [];
            // 筛选出各公司的数据
            this.datalist.forEach(v => {
                list = [];
                v.data.forEach(m => {
                    var obj = null;
                    list.forEach(n => {
                        if (n.name === m[this.row]) {
                            obj = n;
                        }
                    });
                    if (!obj) {
                        obj = {
                            name: m[this.row],
                            data: []
                        };
                        list.push(obj);
                    }
                    obj.data.push(m);
                });
                v.list = list;
                v.list.push({
                    name: '总计',
                    data: v.data
                });
            });
            let num = 0;
            let info = null;
            // 统计各三级分类数据
            this.datalist.forEach(v => {
                v.list.forEach(n => {
                    info = n.info = [];
                    this.typelist.forEach(m => {
                        num = 0;
                        n.data.forEach((l, x) => {
                            if (m[this.three] === l[this.type]) {
                                num++;
                                if (info.some(k => k.name === m[this.three])) {
                                    info.forEach(j => {
                                        if (j.name === m[this.three]) {
                                            j.num = num;
                                        }
                                    });
                                } else {
                                    info.push({ name: l[this.type], parent: m[this.two], root: m[this.first], num });
                                }
                            }
                        });
                    });
                });
            });
            // 格式化数据
            this.datalist.forEach((v, i) => {
                this.statslist[i] = { time: v.time, list: [] };
                v.list.forEach((m, j) => {
                    let info = { corp: m.name, key: j };
                    // 总计
                    m.info.forEach(n => {
                        info['数量'] = (info['数量'] ? info['数量'] : 0) + (n.num ? n.num : 0);
                        info['同比'] = '-';
                    });
                    // 合计
                    m.info.forEach(n => {
                        info[n.root + '数量'] = (info[n.root + '数量'] ? info[n.root + '数量'] : 0) + (n.num ? n.num : 0);
                        info[n.root + '同比'] = '-';
                        info[n.root + '占比'] = Math.round(info[n.root + '数量'] / info['数量'] * 10000) / 100 + '%';
                    });
                    // 小计
                    m.info.forEach(n => {
                        info[n.root + n.parent + '数量'] = (info[n.root + n.parent + '数量'] ? info[n.root + n.parent + '数量'] : 0) + (n.num ? n.num : 0);
                        info[n.root + n.parent + '同比'] = '-';
                        info[n.root + n.parent + '占比'] = Math.round(info[n.root + n.parent + '数量'] / info[n.root + '数量'] * 10000) / 100 + '%';
                    });
                    // 叶子分类统计
                    m.info.forEach(n => {
                        info[n.root + n.parent + n.name + '数量'] = n.num;
                        info[n.root + n.parent + n.name + '同比'] = '-';
                        info[n.root + n.parent + n.name + '占比'] = Math.round(n.num / info[n.root + n.parent + '数量'] * 10000) / 100 + '%';
                    });
                    // 合计
                    this.statslist[i].list.push(info);
                });
            });
        },
        exportData() {
            let head = this.xxx(this.statslist);
            console.log(head);
            // exportJsonToExcel([], [], this.statstime + '日报');
        },
        xxx(data) {
            let list = [];
            data.forEach(v => {
                if (!v.children || v.children.length === 0) return list.push(v);
                list = [ ...list, ...this.xxx(v.children) ];
            });
            return list;
        }
    }
};
</script>

<style lang="less">
html,
body,
div,
input,
p,
span,
a {
    box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  background: #f2f2f2;
  margin: 0;
  padding: 0;
}

.export {
  width: 80%;
  height: 80vh;
  margin: auto;
  border-radius: 20px;
  position: relative;
  top: 10%;
  padding: 40px;
  background-color: white;
  padding-top: 142px;
}
.title {
  text-align: center;
  font-size: 24px;
  line-height: 30px;
  margin-top: -102px;
  margin-bottom: 30px;
}
.ant-steps {
  margin-bottom: 10px;
}
.box {
  width: 100%;
  height: 100%;
  padding-bottom: 42px;
  position: relative;
}
.mask {
    position: absolute;
    top: 142px;
    right: 40px;
    left: 40px;
    bottom: 40px;
    background-color: white;
    z-index: 1;
    text-align: center;
    .ant-spin {
        position: relative;
        top: 50%;
        transform: translateY(-250%);
    }
}
.ant-table-diy,
.ant-table-diy thead,
.ant-table-diy tbody,
.ant-table-diy th,
.ant-table-diy tr,
.ant-table-diy td {
    display: block;
}
.ant-table-diy {
    width: 100%;
    height: 100%;
    padding-top: 53px;
    margin-bottom: 10px;
    display: flex;
    flex-flow: column;
    overflow: auto;
}
.ant-table-thead-diy tr {
    margin-top: -53px;
}
.ant-table-thead-diy tr,
.ant-table-tbody tr {
    display: flex;
}
.ant-table-thead-diy th,
.ant-table-tbody td {
    flex: 1;
    min-width: 180px;
}
.ant-table-tbody-diy {
    height: 100%;
}
[class*='box-btn'] {
    position: absolute;
}
[class*='box-btn-bottom'] {
    bottom: 0;
}
.box-btn-bottom-right {
    right: 0;
}
.box-btn-bottom-left {
    left: 0;
}
.center {
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -150%);
}
</style>
