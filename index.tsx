import * as React from 'react'
import * as ReactDOM from 'react-dom'
import 'script-loader!vss-web-extension-sdk/lib/VSS.SDK.min.js'
import 'script-loader!./zip/zip.js'
import {ResultsViewer, Dropdown} from 'sarif-web-component/Index.tsx'

declare var zip: any, VSS: any
const promisify = (f, ...args) => new Promise(r => f(...args, r)) as any

class Tab extends React.Component<any, any> {
	state = { files: undefined, fileIndex: 0 }
	constructor(props) {
		super(props)
		VSS.init({ explicitNotifyLoaded: true })
		VSS.require(['TFS/Build/RestClient'], restClient => {
			const client = restClient.getClient()
			const onBuildChanged = async build => {
				const artifacts = await client.getArtifacts(build.id, build.project.id)
				const files = await (async () => {
					if (!artifacts.some(a => a.name === 'CodeAnalysisLogs')) return []
					const logsZip = await client.getArtifactContentZip(build.id, 'CodeAnalysisLogs', build.project.id)
					const reader = await promisify(zip.createReader, new zip.BlobReader(new Blob([new Uint8Array(logsZip)])))
					const entries = await promisify(reader.getEntries.bind(reader))
					return entries
						.filter(entry => entry.filename.endsWith('.sarif'))
						.map((entry, i) => {
							let p = undefined
							return {
								key: i, text: entry.filename.replace('CodeAnalysisLogs/', ''),
								sarif: () => p = p || promisify(entry.getData.bind(entry), new zip.TextWriter())
							}
						})
				})()
				this.setState({ files })
				VSS.notifyLoadSucceeded()
			}
			VSS.getConfiguration().onBuildChanged(onBuildChanged) // ;onBuildChanged({ id: 75 })
		})
	}
	render() {
		const {files, fileIndex} = this.state
		const diff = files && files.filter(f => f.text === 'diff.sarif').shift()
		const dd = <Dropdown className="resultsDropdown"
			options={files} selectedKey={fileIndex}
			onChange={(ev, option, i) => this.setState({ fileIndex: i })} />
		return !files || files.length
			? <ResultsViewer sarif={diff && diff.sarif() || files && files[fileIndex].sarif()} prefix={!diff && dd} />
			: <div className="full">No SARIF artifacts found.</div>
	}
}

ReactDOM.render(<Tab />, document.getElementById("app"))
