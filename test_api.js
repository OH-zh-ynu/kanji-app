const fetch = require('node-fetch');

async function test() {
    const apiKey = 'f15b7ad9efab6381';
    const codes = ['B009', 'B010', 'B011', 'B001', 'B002', 'B003', 'B008', 'B004', 'B005', 'B006'];

    // Test 1: all codes comma separated
    const url1 = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&budget=${codes.join(',')}&format=json&count=1&keyword=東京`;
    console.log("Test 1 URL:", url1);
    try {
        const res1 = await fetch(url1);
        const data1 = await res1.json();
        console.log("Test 1 Success. Results:", data1.results.results_available);
    } catch (e) { console.log("Test 1 Failed", e.message); }

    // Test 2: all codes multi param
    const url2 = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}${codes.map(c => '&budget=' + c).join('')}&format=json&count=1&keyword=東京`;
    console.log("Test 2 URL:", url2);
    try {
        const res2 = await fetch(url2);
        const data2 = await res2.json();
        console.log("Test 2 Success. Results:", data2.results.results_available);
    } catch (e) { console.log("Test 2 Failed", e.message); }
}

test();
