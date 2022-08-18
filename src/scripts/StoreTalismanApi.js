import axios from 'axios';
import StoreRestApi from './StoreRestApi';
import urlJoin from 'url-join';

export default class StoreTalismanApi extends StoreRestApi {
	constructor(config, baseUrl) {
		const sitemapsPath = urlJoin('api', 'sitemaps/');
		super(config, baseUrl, sitemapsPath);
	}

	async initTalismanLogin(credentials) {
		let bodyForm = new FormData();
		let tLogin = credentials.username;
		let tPassword = credentials.password;
		bodyForm.append('username', tLogin);
		bodyForm.append('password', tPassword);
		return await this.axiosInstance.post(
			urlJoin(this.axiosInstance.defaults.baseURL, '/oauth/login'),
			bodyForm,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
	}

	async isAuthorized() {
		let tUrl = this.axiosInstance.defaults.baseURL;
		try {
			tUrl = new URL(tUrl).origin;
		} catch (err) {
			$('.alert').attr('id', 'error').text(err).show();
			return false;
		}
		let response = await axios({
			method: 'get',
			url: `${tUrl}/oauth/token`,
		});
		try {
			if (response.data.preferred_username) {
				return response.data;
			} else {
				return false;
			}
		} catch (er) {
			$('.alert').attr('id', 'error').text(er).show();
			return false;
		}
	}

	async logOut() {
		delete this.axiosInstance.defaults.headers.Authorization;
		await this.axiosInstance.get('/oauth/logout');
	}
}
