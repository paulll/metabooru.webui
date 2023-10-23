import CID from 'cids';

const API_HOST = 'https://booru.paulll.cc/api';
const $ = document.querySelector.bind(document);
const hashParams = new URLSearchParams(document.location.hash.slice(1));

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

const addr2href = (addr) => {
	const cid = new CID(addr).toV1().toString('base32');
	const thirdParty = [
		//`https://${cid}.ipfs.dweb.link/`,
		//`https://${cid}.ipfs.cf-ipfs.com/`,
		//`https://${cid}.ipfs.infura-ipfs.io/`,
		`https://ipfs.io/ipfs/${addr}`,
		//`https://cloudflare-ipfs.com/ipfs/${addr}`
	];
	shuffle(thirdParty);

	//return thirdParty[0];
	//return `https://ipfs.paulll.cc/ipfs/${addr}`;//thirdParty[0];
	return `https://blob.paulll.cc/booru/${addr}`;
}


const loadPage = async (query, from) => {
	const token = localStorage.getItem('booru.token');
	if (!localStorage.getItem('booru.me')) {
		const me = await fetch(`${API_HOST}/me`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		}).then(x => x.json());

		localStorage.setItem('booru.me', JSON.stringify(me));
	}

	const me = JSON.parse(localStorage.getItem('booru.me'));
	$('#hi').textContent = `hi, ${me.name}!`



	const grid = $('#image-grid')
	const result = await fetch(`${API_HOST}/images?query=${encodeURIComponent(query)}&from=${from}`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	}).then(x => x.json());



	for(let img of result) {
		const createControls = () => {
			const eControlsWrap = document.createElement('div');
			eControlsWrap.className = 'controls-wrap';

			for (let imageSource of img.sources) {
				const eControlSource = document.createElement('a');
				eControlSource.className = 'controls-approve';
				eControlSource.textContent = '🌎';
				eControlSource.href = imageSource.link_sample;
				eControlsWrap.appendChild(eControlSource);
			}
			

			const eControlApprove = document.createElement('span');
			eControlApprove.className = 'controls-approve';
			eControlApprove.textContent = '🔥';
			if (img.approves.map(x=>x.id).includes(me.id))
				eControlApprove.style.opacity = 1;
			eControlApprove.onclick = () => {
				fetch(`${API_HOST}/images/${img.id}/approve`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				eControlApprove.style.opacity = 1;
			}
			eControlsWrap.appendChild(eControlApprove);

			// const eControlDisapprove = document.createElement('span');
			// eControlDisapprove.className = 'controls-disapprove';
			// eControlDisapprove.textContent = '💩';
			// eControlsWrap.appendChild(eControlDisapprove);
			

			

			return eControlsWrap;
		}

		const createImage = () => {
			const [hrefPre, hrefFull] = img.resource
				.filter(x => x)
				.map(addr2href);

			const eImg = document.createElement('img');
			eImg.src = hrefFull;
			eImg.dataset.src = hrefPre;

			return eImg;
		}

		const eImgWrap = document.createElement('div');
		eImgWrap.className = 'img-wrap';
		eImgWrap.appendChild(createControls());
		eImgWrap.appendChild(createImage());
		eImgWrap.dataset.tags = img.tags.map(x=>x.name).join(' ');
		
		grid.appendChild(eImgWrap);
	}

	return result;
}

const updateQuery = async () => {
	const query = $('#search-box').value;
	hashParams.set('query', query);
	$('#image-grid').textContent = '';
	document.location.hash = hashParams.toString();
	let result = await loadPage(query, 0);
	let lastId = result[result.length-1].id;

	let observer = new IntersectionObserver(async (entries, observer) => {
		for( let entry of entries ) {
			if (entry.isIntersecting) {
				observer.unobserve(entry.target);
				let result = await loadPage(query, lastId);
				if (result.length) {
					lastId = result[result.length-1].id;	
					observer.observe($('#image-grid>div:last-child'))
				}
			}
		}
	}, { threshold: 0.1 });

	observer.observe($('#image-grid>div:last-child'));
}


(async () => {
	if (hashParams.has('token')) {
		localStorage.setItem('booru.token', hashParams.get('token'));
		hashParams.delete('token');
		document.location.hash = hashParams.toString();
	}

	$('#search-box').value = hashParams.get('query')
	await updateQuery();
	$('#search-box').onchange = updateQuery;
})()