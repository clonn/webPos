/**
 * @overview
 * Using jQuery with ejs html template engine.
 *
 * @author Caesar Chi (clonn)
 * @version 2012/05/26
 */
(function ($) {
    var host = window.location.hostname,
        displayNode,
        chatTpl,
        socket;

    $(document).ready(function () {
        displayNode = $("#display-message");
        chatTpl = $("#js-template");
        socket = io.connect(host);
        

        function getCookie(name)
        {
            var arg = name + "=";
            var alen = arg.length;
            var clen = document.cookie.length;
            var i = 0;
            while (i < clen) {
                var j = i + alen;
                if (document.cookie.substring(i, j) == arg)
                    return getCookieVal(j);
                i = document.cookie.indexOf(" ", i) + 1;
                if (i == 0) break;
            }
            return null;
        }

        function getCookieVal(offset)
        {
            var endstr = document.cookie.indexOf(";", offset);
        if (endstr == -1)
            endstr = document.cookie.length;
            return unescape(document.cookie.substring(offset, endstr));
        }

        socket.on("recieveMsg", function (data) {
            if (data.status !== "ok") {
                alert(1);
                return;
            }
            var msgNode = self.find("#message"),
                newMsgNode= $(chatTpl.html());


            console.log(data);
            newMsgNode.find(".snapshot").html([
                "<img src='http://graph.facebook.com/",
                data.userid,
                "/picture'>",    
            ].join(""));

            newMsgNode.find(".message").html(data.msg);
            newMsgNode.find(".time").html(", Time: " + new Date().getTime());
            displayNode.append(newMsgNode);
        });

        $("#chat").submit(function (e) {
            e.preventDefault();

            var self = $(this),
                msgNode = self.find("#message"),
                newMsgNode= $(chatTpl.html()),
                selfValue = msgNode.val();

            newMsgNode.find(".snapshot").html([
                "<img src='http://graph.facebook.com/",
                getCookie('userid'),
                "/picture'>",    
            ].join(""));

            newMsgNode.find(".message").html(selfValue);
            newMsgNode.find(".time").html(", Time: " + new Date().getTime());
            displayNode.append(newMsgNode);
            msgNode.val("");
            socket.emit("sendMsg", {msg: selfValue});

        });

    });
})(jQuery);



