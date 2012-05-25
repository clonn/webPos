/**
 * @overview
 * Using jQuery with ejs html template engine.
 *
 * @author Caesar Chi (clonn)
 * @version 2012/05/26
 */
(function ($) {
    //var host = 'http://clonn.info:3000',
    var host = 'http://localhost:3000',
        displayNode,
        chatTpl,
        socket;

    $(document).ready(function () {
        displayNode = $("#display-message");
        chatTpl = $("#js-template");
        socket = io.connect(host);

        socket.on("recieveMsg", function (data) {
            if (data.status !== "ok") {
                alert(1);
                return;
            }
            var msgNode = self.find("#message"),
                newMsgNode= $(chatTpl.html());


            console.log(data);

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

            newMsgNode.find(".message").html(selfValue);
            newMsgNode.find(".time").html(", Time: " + new Date().getTime());
            displayNode.append(newMsgNode);
            msgNode.val("");
            socket.emit("sendMsg", {msg: selfValue});

        });

    });
})(jQuery);



