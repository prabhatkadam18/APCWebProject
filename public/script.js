var btnSubmit = document.getElementById('btnSubmit');
var divInvalid = document.getElementById('invalid');

var data;   
btnSubmit.addEventListener('click', function (event) {
    event.preventDefault();
    var tmp = new Object();
    tmp.username = document.getElementById('username').value;
    tmp.password = document.getElementById('password').value;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if(xhttp.status === 200){
                console.log(this.responseText);
                data = JSON.parse(this.responseText);
                if(data.validate == 1){
                    location.assign('/session');
                }
                else{
                    divInvalid.setAttribute('style','display: block;');
                }
            }  
        }
    }
    xhttp.open("POST", "/login");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(tmp));

});



