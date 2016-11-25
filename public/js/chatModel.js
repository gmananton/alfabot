/**
 * Created by U_M0UW8 on 11.11.2016.
 */



class Message extends React.Component{
    constructor(props)
    {
        super(props);
        this.state={authorName: props.authorName, date: props.date, messageText: props.messageText}
    }
    render()
    {
        if(this.state.authorName=="auto") //не выдавать ничего при заданных условиях
            return null;



        return(
            <div className="message">
        <div className="author">{this.state.authorName}</div>
    <div className="date">{this.state.date}</div>
    <div className="messageText">{this.state.messageText}</div>
    </div>
    );
    }

}

class FieldForm extends React.Component {

    constructor(props)
    {
        super(props);

    }

    onMessageTextChanged = (e)=>
{
    this.props.onMessageTextChanged(e.target.value);
}
onSenderIdTextChanged = (e)=>
{
    this.props.onSenderIdTextChanged(e.target.value);
}


render() {
    return (<form className="formInput" onSubmit={this.props.onMessageSubmit}>
    <label>SenderId:</label><input type="text" className="formSenderId" value={this.props.senderId} onChange={this.onSenderIdTextChanged} /><br/>
    <label>Message:</label><textarea type="text" className="formMessageText" value={this.props.messageText} onChange={this.onMessageTextChanged}/>
    <input className="formSubmit" type="submit" value="Submit" />
        </form>);
}

}

class Chat extends React.Component{
    constructor(props)
    {
        super(props)
        this.state={

            chatName: "defaultChatName",
            formData: props.formData,
            messages: props.messages
        }


    }

    onMessageTextChanged = (newValue)=> {
        this.setState(function (prevState, props) {

            var s = prevState;                          //а как можно смерждить json
            s.formData.messageText = newValue;
            return s;

        });
    }

//onSenderIdTextChanged(newValue)
    onSenderIdTextChanged = (newValue)=> {

        this.setState(function (prevState, props) {

            var s = prevState;
            s.formData.senderId = newValue;
            return s;

        });

    }


    messageSubmit = (e) => {
        e.preventDefault();
        console.log(this.state.formData)

        $.ajax({
            url: "/debug/sendChatMessage",
            dataType: 'json',
            data: {senderId: this.state.formData.senderId, messageText: this.state.formData.messageText},

            type: 'GET',
            success: function (data, textStatus, jqXHR) {
                console.log("ajax success");


                this.setState(function (prevState, props) {
                    var s = prevState;

                    for(var i=0; i<data.length; i++) {

                        s.messages.push({authorName: data[i].senderId, messageText: data[i].messageText, date: data[i].date});
                    }
                    return s;

                });

            }.bind(this),
            error: function (xhr, status, err) {
                console.error("ajax error");

                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });



};




render()
{
    const messagesCount = this.state.messages.length;

    const messages = this.state.messages.map((post, index) =>
        <Message
    key={index}
    authorName={post.authorName}
    messageText = {post.messageText}
    date = {post.date}
/>
).reverse();

    return(
        <div className="chat">
    <h2>{this.state.chatName}</h2>
<FieldForm senderId={this.state.formData.senderId}
    messageText={this.state.formData.messageText}
    onMessageSubmit={this.messageSubmit}
    onMessageTextChanged={this.onMessageTextChanged}
    onSenderIdTextChanged={this.onSenderIdTextChanged}

></FieldForm>
<div className="messagesCount">Сообщений: {messagesCount}</div>
<div className="messages">
    {messages}
    </div>
    </div>
);
}

}

