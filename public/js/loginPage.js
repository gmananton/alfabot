/**
 * Created by U_M0UW8 on 11.11.2016.
 */





 submitLogin = function(login, password, chatUserHash) {

        $.ajax({
            url: "/misc/loginToAlbo", //переделать путь в правильный
            dataType: 'json',
            data: {login: login, password: password, chatUserHash: chatUserHash},

            type: 'GET',
            success: function (data, textStatus, jqXHR) {

                if(data.success)
                    console.log("ajax success Login");
                else
                    console.log("ajax failure Login");




            },
            error: function (xhr, status, err) {
                console.error("ajax error");

                //console.error(this.props.url, status, err.toString());
            }
        });



};


QueryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
};




