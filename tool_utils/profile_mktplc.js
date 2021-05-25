

// --------------------------------------------------------------------------
//  GET DATA 
// -------------------------------------------------------------------------- 
// Decode base64 (convert ascii to binary)
var strData     = atob(zipped);
var charData    = strData.split('').map(function(x){return x.charCodeAt(0);});
var binData     = new Uint8Array(charData);
var data        = pako.inflate(binData, { to: 'string' });


data_df = JSON.parse(data);
data_df = JSON.parse(data_df);
map_json = JSON.parse(map_json_r); 

document.getElementById("defaultOpen").click();

var attrCols = [
    // responses: Acquisitions
    {class:"y", name:"FY21 YTD "+partnerp+" +-" ,profile_y:true   ,column:"fy21_"+partner+"_d"     ,format:d3.format(".2s"),scale:"q",color:"YlOrRd"},
    {class:"y", name:"FY21 YTD "+partnerp+" #" ,profile_y:true      ,column:"fy21_"+partner+"_n"     ,format:d3.format(".3s"),scale:"q",color:"YlOrRd"},
    {class:"y", name:"FY20 YTD "+partnerp+" #" ,profile_y:true      ,column:"fy20_"+partner+"_n"     ,format:d3.format(".3s"),scale:"q",color:"YlOrRd"},        // response: Members 
    {class:"y", name:"FY21 YTD "+partnerp+" Grth" ,profile_y:true   ,column:"fy21_"+partner+"_g"     ,format:d3.format("0.2%"),scale:"q",color:"YlOrRd"},
    {class:"y", name:"FY21 YTD "+partnerp+" %" ,profile_y:true   ,column:"fy21_"+partner+"_r"     ,format:d3.format("0.2%"),scale:"q",color:"YlOrRd"},
    
    {class:"y", name:partnerp + " #",trend_y:true,column:partner+"_n"     ,format:d3.format(",.0f"),scale:"q",color:"YlOrRd"},
    {class:"y", name:partnerp + " %",trend_y:true,column:partner+"_r"     ,format:d3.format(".2%"),scale:"q",color:"YlOrRd"},
    {class:"y", name:"NRMA #",trend_y:true ,column:"active_n"   ,format:d3.format(",.0f"),scale:"q",color:"YlOrRd"},
    // attributes: Product
    // {class:"x", name:"Product Group",htmlref:"column2",column:"prod_grp",order:["NRMA Blue - Free","NRMA Blue - Paid","Classic Care","Premium Care"]},
    {class:"x", name:"Product Group",htmlref:"column2",column:"prod_grp",profile_y:true,trend_y:true},
    {class:"x", name:"SA4 Region",htmlref:"column2",column:"sa4_region",profile_y:true,trend_y:true},
    {class:"x", name:"SA4 Sub Region",htmlref:"column2",column:"sa4_metro_cat",profile_y:true,trend_y:true},
    // attributes: Member attributes
    {class:"x", name:"Overall",htmlref:"column1",column:"dummy",profile_y:true,trend_y:true},
    {class:"x", name:"Colour+ Segment",htmlref:"column1",column:"member_colour",profile_y:true,trend_y:true,order:["CYAN","GREEN","RED","YELLOW","BROWN","PURPLE","ORANGE","KHAKI","GREY","LILAC"]},
    {class:"x", name:"NRMA Tenure",htmlref:"column1",column:"member_tenure",profile_y:true,trend_y:true,order:["y_0","y_1_2","y_3+"]},
    {class:"x", name:"Age Band",htmlref:"column1",column:"member_ageband",profile_y:true,trend_y:true},

    {class:"x", name:"Culture",htmlref:"column3",column:"surname_culture",profile_y:true,trend_y:true},
    {class:"x", name:"Gender",htmlref:"column3",column:"member_gender",profile_y:true,trend_y:true},

    // Trend profile
    {class:"x", name:"Month",htmlref:"column2",column:"month",profile_y:true,trend_y:false,order:["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"]},
    {class:"x", name:"CY Qtr",htmlref:"column3",column:"cy_qtr",profile_y:true,trend_y:false,order:["3","4","1","2"]},

    // trend attributes 
    {class:"dt", name:"Month",column:"yyyymm",order:['1906', '1907', '1908', '1909', '1910', '1911',
    '1912', '2001', '2002', '2003', '2004', '2005','2006', '2007', '2008', '2009', '2010', '2011','2012', '2101']},
    {class:"dt", name:"Quarter",column:"yyyyq",order:['192', '193', '194', '201', '202', '203', '204','211']},


    // Geography
    {class:"g", name:"SA4",column:"member_sa4"},
    // {class:"x", name:"SA4_NAME",column:"SA4_NAME_2016",htmlref:"column1"},
    // Profiling column
    {class:"p", name:"Profile",column:"profile",order:['n','d']},
    {class:"p", name:"dummy",column:"dummy"},
    {class:"p", name:"xCol",column:"xCol"},
    {class:"p", name:"xCol_v",column:"xCol_v"},
    {class:"p", name:"type_var",column:"type_var"},
];

var geoField = "member_sa4";


var rollupFunction = function(d) {
    // profiling
    aggFuncs = {
        'fy20_active_n': d3.sum(d, n=> String(n.year_fy) ==='2020' && n.ytd === 1 ? n['active_n'] : 0 ),
        'fy21_active_n': d3.sum(d, n=> String(n.year_fy) ==='2021' && n.ytd === 1 ? n['active_n'] : 0 ),
    };
    aggFuncs['fy20_'+partner+'_n'] = d3.sum(d, n=> String(n.year_fy) ==='2020' && n.ytd === 1 ? n[partner+'_n'] : 0 )
    aggFuncs['fy21_'+partner+'_n'] = d3.sum(d, n=> String(n.year_fy) ==='2021' && n.ytd === 1 ? n[partner+'_n'] : 0 )
    // trend 
    aggFuncs['active_n'] = d3.sum(d, n=> n['active_n']);
    aggFuncs[partner+'_n'] = d3.sum(d, n=> n[partner+'_n']);

    return aggFuncs;
}

var derivedFunction  = [ 
    {'c':'fy21_'+partner+'_d' ,'f': r => r['fy21_'+partner+'_n'] - r['fy20_'+partner+'_n']  },
    {'c':'fy21_'+partner+'_g' ,'f': r => r['fy21_'+partner+'_n'] / r['fy20_'+partner+'_n'] - 1  },
    {'c':'fy21_'+partner+'_r' ,'f': r => r['fy21_'+partner+'_n'] / r['fy21_active_n']  },
    {'c':'fy20_'+partner+'_r' ,'f': r => r['fy20_'+partner+'_n'] / r['fy20_active_n']  },
    {'c':partner+'_r' ,'f': r => r[partner+'_n'] / r['active_n']  },
]

