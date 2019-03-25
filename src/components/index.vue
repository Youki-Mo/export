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
            <el-button v-show="typelist.length === 0" size="small" @click="$refs.typefile.click()" class="center">点击选择文件</el-button>
            <div class="box-content" v-show="typelist.length !== 0">
                <el-table ref="table1" :data="typelist" height="100%">
                    <el-table-column v-for="(item, i) in typehead" :key="i" :prop="'type'+i" :label="item"></el-table-column>
                </el-table>
                <div class="box-btn-bottom-right">
                    <el-button size="small" @click="$refs.typefile.click()">重新选择</el-button>
                    <el-button size="small" @click="step++">下一步</el-button>
                </div>
            </div>
        </div>
        <div class="box active" v-if="step === 1" v-loading="loading">
            <input @change="datafile('data')" ref="datafile" type="file" hidden>
            <el-button v-show="datalist.length === 0" size="small" @click="$refs.datafile.click()" class="center">点击选择文件</el-button>
            <div class="box-content" v-show="datalist.length !== 0">
                <el-table ref="table2" :data="list" height="100%">
                    <el-table-column v-for="(item, i) in datahead" :key="i" :prop="'data'+i" :label="item" :width="item.length * 30"></el-table-column>
                </el-table>
                <div class="box-btn-bottom-right">
                    <el-button size="small" @click="$refs.datafile.click()">重新选择</el-button>
                    <el-button size="small" @click="step++, generate()" :disabled="count === 0">生成日报</el-button>
                </div>
                <div class="box-select-bottom">
                    <el-date-picker size="small" type="dates" :picker-options="pickerOptions" :default-value="defaultTime" v-model="datatime" value-format="yyyy-MM-dd" placeholder="选择一个或多个日期"></el-date-picker>
                </div>
                <div class="sum">
                    <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                        :current-page="page"
                        :page-sizes="[10, 20, 50, 100]"
                        :page-size="size"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="count">
                    </el-pagination>
                    <span>总计条数：{{sum}}</span>
                </div>
            </div>
            <el-button size="small" @click="step--" class="box-btn-bottom-left">上一步</el-button>
        </div>
        <div class="box auto" v-if="step === 2">
            <el-table ref="table3" :data="statslist" height="100%">
                <el-table-column v-for="(a, i) in statshead" :key="i" :label="a.title" :prop="a.dataIndex">
                    <el-table-column v-for="(b, n) in a.children" :key="n" :label="b.title" :prop="b.dataIndex">
                        <el-table-column v-for="(c, m) in b.children" :key="m" :prop="c.dataIndex" :label="c.title" :width="c.width * 10">
                            <el-table-column v-for="(d, k) in c.children" :key="k" :prop="d.dataIndex" :label="d.title" :width="d.width * 10"></el-table-column>
                        </el-table-column>
                    </el-table-column>
                </el-table-column>
            </el-table>
            <div class="box-btn-bottom-right">
                <el-date-picker size="small" type="dates" :picker-options="pickerOptions" v-model="datatime" :default-value="defaultTime" @change="generate()" value-format="yyyy-MM-dd" placeholder="选择一个或多个日期"></el-date-picker>
                <el-button size="small" @click="exportData">导出</el-button>
            </div>
            <el-button size="small" @click="step--" class="box-btn-bottom-left">上一步</el-button>
        </div>
    </div>
</template>

<script>
import { exportJsonToExcel } from '@/vendor/Export2Excel';
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
            datatime: [],
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
            statshead: [], // 统计表头
            statslist: [], // 显示数据
            timelist: [],
            row: '供电单位', // 竖列字段
            type: '业务子类型', // 用于区分出属于竖列字段的数据
            first: '一级分类',
            two: '二级分类',
            three: '三级分类',
            time: '受理时间', // 日期
            sum: 0, // 总计数量
            page: 1, // 当前所在页数
            size: 20, // 当前显示数量
            count: 0, // 当前统计
            pickerOptions: {},
            dataStats: []
        };
    },
    created() {
        let _this = this;
        this.pickerOptions = {
            shortcuts: [{
                text: '全部',
                onClick(picker) {
                    picker.$emit('pick', _this.timelist);
                }
            }, {
                text: '最近一周',
                onClick(picker) {
                    const date = new Date();
                    let list = [];
                    for (let i = 0; i <= 7 - 1; i++) {
                        list[list.length] = date.getTime() - 3600 * 1000 * 24 * i;
                    }
                    list = list.map(v => {
                        let y = new Date(v).getFullYear(),
                            m = new Date(v).getMonth() + 1,
                            d = new Date(v).getDate();
                        return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
                    });
                    picker.$emit('pick', list);
                }
            }, {
                text: '最近一个月',
                onClick(picker) {
                    const date = new Date();
                    let list = [];
                    for (let i = 0; i <= 30 - 1; i++) {
                        list[list.length] = date.getTime() - 3600 * 1000 * 24 * i;
                    }
                    list = list.map(v => {
                        let y = new Date(v).getFullYear(),
                            m = new Date(v).getMonth() + 1,
                            d = new Date(v).getDate();
                        return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
                    });
                    picker.$emit('pick', list);
                }
            }, {
                text: '最近三个月',
                onClick(picker) {
                    const date = new Date();
                    let list = [];
                    for (let i = 0; i <= 90 - 1; i++) {
                        list[list.length] = date.getTime() - 3600 * 1000 * 24 * i;
                    }
                    list = list.map(v => {
                        let y = new Date(v).getFullYear(),
                            m = new Date(v).getMonth() + 1,
                            d = new Date(v).getDate();
                        return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
                    });
                    picker.$emit('pick', list);
                }
            }]
        };
    },
    computed: {
        data() {
            let time = !this.datatime ? [] : this.datatime;
            let item = this.datalist.filter((v, i) => time.indexOf(v.time) >= 0);
            let data = [];
            for (let i in item) {
                data = [...data, ...item[i].data];
            }
            return data;
        },
        list() {
            let list = this.data.filter((v, i) => this.page * this.size - this.size < i + 1 && i + 1 < this.page * this.size);
            return list;
        },
        defaultTime() {
            return this.datatime && this.datatime.length !== 0 ? this.datatime[0] : this.timelist[0];
        }
    },
    watch: {
        data(val) {
            this.count = val.length;
        },
        datatime(val) {
            let time = !val ? [] : val;
            let item = this.datalist.filter((v, i) => time.indexOf(v.time) >= 0);
            let data = [];
            for (let i in item) {
                data = [...data, ...item[i].data];
            }
            this.dataStats = [{ data }];
        },
        step(val) {
            console.log(this.$refs[`table${val + 1}`]);
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
                this.typelist = data;
                localStorage.setItem(`${name}list`, JSON.stringify(data));
                localStorage.setItem(`${name}first`, this.first);
                localStorage.setItem(`${name}two`, this.two);
                localStorage.setItem(`${name}three`, this.three);
                this.loading = false;
            };
            reader.readAsBinaryString(input);
        },
        // 生成日报头部
        generatehead(data) {
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
            return column;
        },
        // 导入数据表
        datafile(name) {
            let input = this.$refs.datafile.files[0];
            this.timelist = [];
            if (input) {
                this.loading = true;
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
                    this.sum = data.length;
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
                        this.datatime = this.timelist;
                        this.datalist = statslist;
                        this.loading = false;
                        this.generate();
                    });
                };
                reader.readAsBinaryString(input);
            }
        },
        // 生成日报
        generate() {
            let list = [];
            // 筛选出各公司的数据
            this.dataStats.forEach(v => {
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
            this.dataStats.forEach(v => {
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
            // 调整生成日报表格头部
            let head = [];
            this.dataStats.forEach(v => {
                v.list.forEach(m => {
                    m.info.forEach(x => {
                        if (!head.some(j => j === x.name)) {
                            head.push(x.name);
                        }
                    });
                });
            });
            this.typelist.forEach(v => {
                head = head.map(m => {
                    return v[this.three] === m ? v : m;
                });
            });
            this.statshead = this.generatehead(head);
            // 格式化数据
            this.dataStats.forEach((v, i) => {
                this.statslist = [];
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
                    this.statslist.push(info);
                });
            });
        },
        exportData() {
            let head = this.formatStatsHead(this.statshead);
            let data = this.statslist.map(v => head.map(j => v[j.dataIndex]));
            exportJsonToExcel(head.map(v => v.dataIndex === 'corp' ? '单位名称' : v.dataIndex), data, `${this.datatime.join('|')}日报`);
        },
        // 格式化表头（便于导出功能使用）
        formatStatsHead(data) {
            let list = [];
            data.forEach(v => {
                if (!v.children || v.children.length === 0) return list.push(v);
                list = [ ...list, ...this.formatStatsHead(v.children) ];
            });
            return list;
        },
        handleSizeChange(val) {
            this.size = val;
        },
        handleCurrentChange(val) {
            this.page = val;
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
.box {
  width: 100%;
  height: 100%;
  padding-bottom: 42px;
  position: relative;
  &.active {
    padding-bottom: 102px;
    .box-select-bottom {
        bottom: 20px;
    }
    [class*='box-btn-bottom'] {
        bottom: -15px;
    }
  }
}
.box-content {
    height: 100%;
}
[class*='box-btn'] {
    position: absolute;
}
[class*='box-btn-bottom'] {
    bottom: -5px;
}
.box-btn-bottom-right {
    right: 0;
}
.box-btn-bottom-left {
    left: 0;
}
.box-select-bottom {
    position: absolute;
    width: 100%;
    height: 40px;
    overflow: auto;
    bottom: 0;
    .el-date-editor.el-input, .el-date-editor.el-input__inner {
        width: 100%;
    }
}
.center {
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -150%);
}
.sum {
    position: absolute;
    bottom: 70px;
    height: 30px;
    font-size: 14px;
    color: #999;
    width: 100%;
    .el-pagination {
        display: inline-block;
    }
    > span {
        float: right;
        line-height: 30px;
    }
}
</style>
