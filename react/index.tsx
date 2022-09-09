/* eslint-disable no-console */
import React, { Component } from 'react'

interface CyberSourceAuthenticationProps {
  appPayload: string
}

declare const $: any

class CybersourcePayerAuth extends Component<CyberSourceAuthenticationProps> {
  private formRef: React.RefObject<HTMLFormElement>

  constructor(
    props:
      | CyberSourceAuthenticationProps
      | Readonly<CyberSourceAuthenticationProps>
  ) {
    super(props)
    this.formRef = React.createRef<HTMLFormElement>()
  }

  public state = {
    submitted: false,
  }

  public componentDidMount() {
    console.log('componentDidMount =>', JSON.stringify(this.props.appPayload))
    if (this.state.submitted) {
      return
    }

    window.addEventListener(
      'message',
      event => {
        if (event.origin === 'https://centinelapistag.cardinalcommerce.com') {
          console.log(event.data)

          const { createPaymentRequestReference } = JSON.parse(
            this.props.appPayload
          )

          console.log(
            'createPaymentRequestReference',
            createPaymentRequestReference
          )
        }
      },
      false
    )

    if (this.formRef.current) {
      this.formRef.current.submit()
      this.setState({ submitted: true })
    }
  }

  public respondTransaction(status: string) {
    $(window).trigger('transactionValidation.vtex', [status])
  }

  public render() {
    const { deviceDataCollectionUrl, accessToken } = JSON.parse(
      this.props.appPayload
    )

    console.log('rendering...')

    return (
      <>
        <iframe
          id="cardinal_collection_iframe"
          title="Cardinal Collection Iframe"
          name="collectionIframe"
          height="10"
          width="10"
          style={{ display: 'none' }}
        />
        <form
          ref={this.formRef}
          id="cardinal_collection_form"
          method="POST"
          target="collectionIframe"
          action={deviceDataCollectionUrl}
        >
          <input
            id="cardinal_collection_form_input"
            type="hidden"
            name="JWT"
            value={accessToken}
          />
        </form>
      </>
    )
  }
}

export default CybersourcePayerAuth
