import React, { Component } from 'react'

class CybersourcePayerAuth extends Component {
  constructor(props) {
    super(props)
    this.formRef = React.createRef<HTMLFormElement>('payerAuth')
    this.state = {
      submitted: false,
    }
  }

  componentDidMount() {
    console.log('componentDidMount =>', JSON.stringify(this.props.appPayload))
  }

  componentDidUpdate() {
    if(this.state.submitted)
    {
      return;
    }
    window.addEventListener('message', function(event) {
      console.log(event.data);
      }, false);
      this.formRef.current && this.formRef.current.submit()
      this.setState({ submitted: true })
  }

  respondTransaction = status => {
    $(window).trigger('transactionValidation.vtex', [status])
  }

  render () {
    const { deviceDataCollectionUrl, accessToken } = JSON.parse(this.props.appPayload)
    console.log('rendering...')
    return (
      <><iframe id="cardinal_collection_iframe" name="collectionIframe" height="10" width="10" style="display:none;"></iframe>
      <form ref={this.formRef} id="cardinal_collection_form" method="POST" target='collectionIframe' action={deviceDataCollectionUrl}>
        <input id="cardinal_collection_form_input" type="hidden" name="JWT" value={accessToken} /></form></>
    )
  }
}

export default CybersourcePayerAuth
