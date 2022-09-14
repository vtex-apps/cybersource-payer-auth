/* eslint-disable no-console */
import React, { Component } from 'react'
import { useMutation } from 'react-apollo'

import PayerAuthorize from './mutations/payerAuthorize.gql'

const [payerAuthorize] = useMutation(PayerAuthorize)

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

          payerAuthorize({
            variables: {
              paymentId: createPaymentRequestReference,
            },
          }).then(response => {
            let result = 'false'

            if (response.data?.payerAuthResponse === 'approved') {
              result = 'true'
            }

            this.respondTransaction(result)
          })
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
    console.log('respondTransaction', status)
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
